import { Controller, Get, Patch, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema.js';
import { User, UserDocument } from '../../schemas/user.schema.js';
import { StorageUsage, StorageUsageDocument } from '../../schemas/storage-usage.schema.js';
import { PlatformRole, BusinessRole, UserStatus } from '../../common/constants/roles.enum.js';

@Controller('tenant')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantController {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(StorageUsage.name) private storageUsageModel: Model<StorageUsageDocument>,
  ) {}

  @Get('current')
  async getCurrentTenant(@Req() req: any) {
    const tenant = req.tenant;
    const storageUsage = await this.storageUsageModel.findOne({ tenantId: tenant._id }).exec();
    return {
      tenant,
      storageUsage: storageUsage || { totalBytes: 0, files: [] },
    };
  }

  @Patch('settings')
  async updateSettings(@Req() req: any, @Body() body: any, @CurrentUser() user: any) {
    const tenant = req.tenant;

    // Allow updating branding and contact
    if (body.name) tenant.name = body.name;
    if (body.location) tenant.location = body.location;
    if (body.address) tenant.address = body.address;
    if (body.ownerPhone) tenant.ownerPhone = body.ownerPhone;
    if (body.logoUrl) tenant.logoUrl = body.logoUrl;
    if (body.primaryColor) tenant.primaryColor = body.primaryColor;
    if (body.accentColor) tenant.accentColor = body.accentColor;
    if (body.currency) tenant.currency = body.currency;
    if (body.currencySymbol) tenant.currencySymbol = body.currencySymbol;
    if (body.timezone) tenant.timezone = body.timezone;

    if (body.receiptSettings) {
      tenant.receiptSettings = {
        ...tenant.receiptSettings,
        ...body.receiptSettings,
      };
    }

    const saved = await tenant.save();
    return saved;
  }

  @Get('storage')
  async getStorageUsage(@Req() req: any) {
    const tenant = req.tenant;
    const storage = await this.storageUsageModel.findOne({ tenantId: tenant._id }).exec();
    const usedBytes = storage?.totalBytes || 0;
    const quotaBytes = tenant.storageQuotaBytes || 4 * 1024 * 1024 * 1024;
    const percentage = Number(((usedBytes / quotaBytes) * 100).toFixed(1));

    return {
      usedBytes,
      quotaBytes,
      usedGb: Number((usedBytes / (1024 * 1024 * 1024)).toFixed(2)),
      quotaGb: Number((quotaBytes / (1024 * 1024 * 1024)).toFixed(2)),
      percentage,
      isNearLimit: percentage >= 80,
      isOverQuota: usedBytes > quotaBytes,
      files: storage?.files || [],
    };
  }

  @Get('staff')
  async getStaff(@Req() req: any) {
    const tenant = req.tenant;
    return this.userModel
      .find({ tenantId: tenant._id })
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .exec();
  }

  @Post('staff')
  async addStaff(@Req() req: any, @Body() body: any) {
    const tenant = req.tenant;
    const existing = await this.userModel.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      throw new BadRequestException('Email is already registered to a user');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password || 'Staff@2026', salt);

    const newStaff = new this.userModel({
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone,
      passwordHash,
      platformRole: PlatformRole.BUSINESS_USER,
      tenantId: tenant._id,
      businessRole: body.businessRole || BusinessRole.CASHIER,
      permissions: body.permissions || ['SALES_CREATE', 'CUSTOMERS_VIEW', 'PRODUCTS_VIEW'],
      status: UserStatus.ACTIVE,
    });

    const saved = await newStaff.save();
    return {
      id: saved._id,
      name: saved.name,
      email: saved.email,
      businessRole: saved.businessRole,
      permissions: saved.permissions,
      status: saved.status,
    };
  }
}

