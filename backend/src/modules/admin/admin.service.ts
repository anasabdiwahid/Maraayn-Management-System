import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema.js';
import { User, UserDocument } from '../../schemas/user.schema.js';
import { StorageUsage, StorageUsageDocument } from '../../schemas/storage-usage.schema.js';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema.js';
import { Product, ProductDocument } from '../../schemas/product.schema.js';
import { Sale, SaleDocument } from '../../schemas/sale.schema.js';
import { CreateMarketDto, UpdateMarketDto, SuspendMarketDto, CreateAdminDto } from './dto/admin.dto.js';
import { PlatformRole, BusinessRole, TenantStatus, UserStatus } from '../../common/constants/roles.enum.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(StorageUsage.name) private storageUsageModel: Model<StorageUsageDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
  ) {}

  async getDashboardStats() {
    const totalMarkets = await this.tenantModel.countDocuments();
    const activeMarkets = await this.tenantModel.countDocuments({ status: TenantStatus.ACTIVE });
    const suspendedMarkets = await this.tenantModel.countDocuments({ status: TenantStatus.SUSPENDED });
    const disabledMarkets = await this.tenantModel.countDocuments({ status: TenantStatus.DISABLED });

    const totalAdmins = await this.userModel.countDocuments({
      platformRole: { $in: [PlatformRole.SUPER_ADMIN, PlatformRole.ADMIN] },
    });

    const tenants = await this.tenantModel.find().select('storageQuotaBytes storageUsedBytes category status createdAt').exec();

    let totalAllocatedBytes = 0;
    let totalUsedBytes = 0;
    let marketsNearLimitCount = 0;
    const categoryCounts: Record<string, number> = {};

    tenants.forEach((t) => {
      totalAllocatedBytes += t.storageQuotaBytes || 0;
      totalUsedBytes += t.storageUsedBytes || 0;
      const usagePercent = t.storageQuotaBytes > 0 ? (t.storageUsedBytes / t.storageQuotaBytes) * 100 : 0;
      if (usagePercent >= 80) {
        marketsNearLimitCount++;
      }
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    const categoryDistribution = Object.keys(categoryCounts).map((cat) => ({
      category: cat,
      count: categoryCounts[cat],
    }));

    const recentMarkets = await this.tenantModel.find().sort({ createdAt: -1 }).limit(5).exec();

    const recentActivities = await this.auditLogModel.find().sort({ createdAt: -1 }).limit(8).exec();

    // Monthly market registration growth (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyGrowth = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      const count = await this.tenantModel.countDocuments({
        createdAt: { $gte: d, $lt: nextMonth },
      });
      monthlyGrowth.push({ month: label, registrations: count });
    }

    return {
      totalMarkets,
      activeMarkets,
      suspendedMarkets,
      disabledMarkets,
      totalAdmins,
      totalUsedBytes,
      totalAllocatedBytes,
      totalUsedGb: Number((totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2)),
      totalAllocatedGb: Number((totalAllocatedBytes / (1024 * 1024 * 1024)).toFixed(2)),
      marketsNearLimitCount,
      categoryDistribution,
      monthlyGrowth,
      recentMarkets,
      recentActivities,
    };
  }

  async getAllMarkets(query: { search?: string; status?: string; category?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { businessCode: searchRegex },
        { ownerName: searchRegex },
        { ownerEmail: searchRegex },
        { ownerPhone: searchRegex },
      ];
    }
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.category && query.category !== 'ALL') {
      filter.category = query.category;
    }

    const total = await this.tenantModel.countDocuments(filter);
    const markets = await this.tenantModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data: markets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMarketById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Market ID');
    }
    const market = await this.tenantModel.findById(id).exec();
    if (!market) {
      throw new NotFoundException('Market not found');
    }

    const storageUsage = await this.storageUsageModel.findOne({ tenantId: market._id }).exec();
    const productCount = await this.productModel.countDocuments({ tenantId: market._id });
    const saleCount = await this.saleModel.countDocuments({ tenantId: market._id });
    const users = await this.userModel.find({ tenantId: market._id }).select('-passwordHash -refreshTokenHash').exec();

    return {
      market,
      storageUsage: storageUsage || { totalBytes: 0, files: [] },
      stats: {
        productCount,
        saleCount,
        userCount: users.length,
      },
      users,
    };
  }

  async createMarket(createDto: CreateMarketDto, adminUser: any) {
    // Check if owner email is already taken
    const existingUser = await this.userModel.findOne({ email: createDto.ownerEmail.toLowerCase() });
    if (existingUser) {
      throw new BadRequestException('E-mail-ka mulkiilaha horey ayaa loogu isticmaalay akoon kale');
    }

    // Generate unique businessCode: e.g. MRY-8492
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = createDto.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'MRY';
    const businessCode = `${prefix}-${randomSuffix}`;

    const quotaGb = createDto.storageQuotaGb || 4;
    const storageQuotaBytes = quotaGb * 1024 * 1024 * 1024;

    const newTenant = new this.tenantModel({
      name: createDto.name,
      businessCode,
      category: createDto.category,
      ownerName: createDto.ownerName,
      ownerEmail: createDto.ownerEmail.toLowerCase(),
      ownerPhone: createDto.ownerPhone,
      location: createDto.location || 'Mogadishu',
      address: createDto.address || '',
      country: createDto.country || 'Somalia',
      logoUrl: createDto.logoUrl || '/logo.png',
      primaryColor: createDto.primaryColor || '#142746',
      accentColor: createDto.accentColor || '#E6AE43',
      currency: createDto.currency || 'USD',
      currencySymbol: createDto.currencySymbol || '$',
      timezone: createDto.timezone || 'Africa/Mogadishu',
      storageQuotaBytes,
      storageUsedBytes: 0,
      isOverQuota: false,
      status: createDto.initialStatus || TenantStatus.ACTIVE,
      subscriptionPlan: createDto.subscriptionPlan || 'Standard Business',
      subscriptionStartDate: new Date(),
    });

    const savedTenant = await newTenant.save();

    // Create Initial StorageUsage doc
    await this.storageUsageModel.create({
      tenantId: savedTenant._id,
      totalBytes: 0,
      files: [],
    });

    // Create Owner User account
    const rawPassword = createDto.initialPassword || 'Maraayn@2026';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const ownerUser = new this.userModel({
      name: createDto.ownerName,
      email: createDto.ownerEmail.toLowerCase(),
      username: businessCode.toLowerCase(),
      phone: createDto.ownerPhone,
      passwordHash,
      platformRole: PlatformRole.BUSINESS_USER,
      tenantId: savedTenant._id,
      businessRole: BusinessRole.OWNER,
      permissions: ['ALL'],
      status: UserStatus.ACTIVE,
    });

    await ownerUser.save();

    // Log administrative action
    await this.auditLogModel.create({
      tenantId: savedTenant._id,
      userId: adminUser?._id,
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.platformRole || 'ADMIN',
      action: 'CREATE_MARKET',
      resource: 'Tenant',
      resourceId: savedTenant._id.toString(),
      details: {
        marketName: savedTenant.name,
        businessCode: savedTenant.businessCode,
        ownerEmail: savedTenant.ownerEmail,
        quotaGb,
      },
    });

    return {
      success: true,
      market: savedTenant,
      initialOwner: {
        email: ownerUser.email,
        username: ownerUser.username,
        initialPassword: rawPassword,
      },
    };
  }

  async updateMarket(id: string, updateDto: UpdateMarketDto, adminUser: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Market ID');

    const market = await this.tenantModel.findById(id).exec();
    if (!market) throw new NotFoundException('Market not found');

    if (updateDto.storageQuotaGb) {
      market.storageQuotaBytes = updateDto.storageQuotaGb * 1024 * 1024 * 1024;
      market.isOverQuota = market.storageUsedBytes > market.storageQuotaBytes;
      if (!market.isOverQuota && market.status === TenantStatus.SUSPENDED && market.suspensionReason?.includes('quota')) {
        market.status = TenantStatus.ACTIVE;
        market.suspensionReason = undefined;
      }
    }

    if (updateDto.name) market.name = updateDto.name;
    if (updateDto.category) market.category = updateDto.category;
    if (updateDto.ownerName) market.ownerName = updateDto.ownerName;
    if (updateDto.ownerEmail) market.ownerEmail = updateDto.ownerEmail.toLowerCase();
    if (updateDto.ownerPhone) market.ownerPhone = updateDto.ownerPhone;
    if (updateDto.location) market.location = updateDto.location;
    if (updateDto.address) market.address = updateDto.address;
    if (updateDto.country) market.country = updateDto.country;
    if (updateDto.logoUrl) market.logoUrl = updateDto.logoUrl;
    if (updateDto.primaryColor) market.primaryColor = updateDto.primaryColor;
    if (updateDto.accentColor) market.accentColor = updateDto.accentColor;
    if (updateDto.currency) market.currency = updateDto.currency;
    if (updateDto.currencySymbol) market.currencySymbol = updateDto.currencySymbol;
    if (updateDto.timezone) market.timezone = updateDto.timezone;

    const updated = await market.save();

    await this.auditLogModel.create({
      tenantId: market._id,
      userId: adminUser?._id,
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.platformRole || 'ADMIN',
      action: 'UPDATE_MARKET',
      resource: 'Tenant',
      resourceId: market._id.toString(),
      details: updateDto,
    });

    return updated;
  }

  async suspendMarket(id: string, suspendDto: SuspendMarketDto, adminUser: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Market ID');
    const market = await this.tenantModel.findById(id).exec();
    if (!market) throw new NotFoundException('Market not found');

    market.status = TenantStatus.SUSPENDED;
    market.suspensionReason = suspendDto.reason;
    market.suspendedAt = new Date();
    market.suspendedBy = adminUser?._id;
    await market.save();

    await this.auditLogModel.create({
      tenantId: market._id,
      userId: adminUser?._id,
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.platformRole || 'ADMIN',
      action: 'SUSPEND_MARKET',
      resource: 'Tenant',
      resourceId: market._id.toString(),
      details: { reason: suspendDto.reason },
    });

    return { success: true, message: 'Ganacsiga si guul leh ayaa loo ganaaxay (SUSPENDED)', market };
  }

  async reactivateMarket(id: string, adminUser: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Market ID');
    const market = await this.tenantModel.findById(id).exec();
    if (!market) throw new NotFoundException('Market not found');

    market.status = TenantStatus.ACTIVE;
    market.suspensionReason = undefined;
    market.suspendedAt = undefined;
    market.suspendedBy = undefined;
    await market.save();

    await this.auditLogModel.create({
      tenantId: market._id,
      userId: adminUser?._id,
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.platformRole || 'ADMIN',
      action: 'REACTIVATE_MARKET',
      resource: 'Tenant',
      resourceId: market._id.toString(),
      details: { status: 'ACTIVE' },
    });

    return { success: true, message: 'Ganacsiga si guul leh ayaa dib loogu furay (ACTIVATED)', market };
  }

  async updateStorageQuota(id: string, quotaGb: number, adminUser: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Market ID');
    if (quotaGb < 0.5) throw new BadRequestException('Quota must be at least 0.5 GB');

    const market = await this.tenantModel.findById(id).exec();
    if (!market) throw new NotFoundException('Market not found');

    const newQuotaBytes = quotaGb * 1024 * 1024 * 1024;
    market.storageQuotaBytes = newQuotaBytes;
    market.isOverQuota = market.storageUsedBytes > newQuotaBytes;

    if (!market.isOverQuota && market.status === TenantStatus.SUSPENDED && market.suspensionReason?.includes('Storage')) {
      market.status = TenantStatus.ACTIVE;
      market.suspensionReason = undefined;
    }

    await market.save();

    await this.auditLogModel.create({
      tenantId: market._id,
      userId: adminUser?._id,
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.platformRole || 'ADMIN',
      action: 'UPDATE_STORAGE_QUOTA',
      resource: 'Tenant',
      resourceId: market._id.toString(),
      details: { newQuotaGb: quotaGb, isOverQuota: market.isOverQuota },
    });

    return {
      success: true,
      message: `Storage quota updated to ${quotaGb} GB`,
      storageQuotaBytes: market.storageQuotaBytes,
      isOverQuota: market.isOverQuota,
      status: market.status,
    };
  }

  // Administrator Management
  async getAdministrators() {
    return this.userModel
      .find({ platformRole: { $in: [PlatformRole.SUPER_ADMIN, PlatformRole.ADMIN] } })
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .exec();
  }

  async createAdministrator(createDto: CreateAdminDto, currentUser: any) {
    if (currentUser.platformRole !== PlatformRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can create administrator accounts');
    }

    const existing = await this.userModel.findOne({ email: createDto.email.toLowerCase() });
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createDto.password, salt);

    const newAdmin = new this.userModel({
      name: createDto.name,
      email: createDto.email.toLowerCase(),
      phone: createDto.phone,
      passwordHash,
      platformRole: createDto.platformRole || PlatformRole.ADMIN,
      permissions: createDto.permissions || ['MARKETS_VIEW', 'MARKETS_MANAGE', 'REPORTS_VIEW'],
      status: UserStatus.ACTIVE,
    });

    const saved = await newAdmin.save();

    await this.auditLogModel.create({
      userId: currentUser._id,
      userName: currentUser.name,
      userRole: currentUser.platformRole,
      action: 'CREATE_ADMINISTRATOR',
      resource: 'User',
      resourceId: saved._id.toString(),
      details: { adminEmail: saved.email, role: saved.platformRole },
    });

    return {
      id: saved._id,
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      platformRole: saved.platformRole,
      permissions: saved.permissions,
      status: saved.status,
    };
  }

  async toggleAdminStatus(adminId: string, currentUser: any) {
    if (currentUser.platformRole !== PlatformRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can toggle administrator status');
    }
    if (currentUser._id.toString() === adminId) {
      throw new BadRequestException('You cannot deactivate your own Super Admin account');
    }

    const target = await this.userModel.findById(adminId);
    if (!target) throw new NotFoundException('Administrator not found');

    target.status = target.status === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    await target.save();

    await this.auditLogModel.create({
      userId: currentUser._id,
      userName: currentUser.name,
      userRole: currentUser.platformRole,
      action: 'TOGGLE_ADMIN_STATUS',
      resource: 'User',
      resourceId: target._id.toString(),
      details: { newStatus: target.status },
    });

    return { success: true, status: target.status };
  }

  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const total = await this.auditLogModel.countDocuments();
    const logs = await this.auditLogModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

