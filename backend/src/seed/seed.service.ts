import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema.js';
import { Tenant, TenantDocument } from '../schemas/tenant.schema.js';
import { Product, ProductDocument } from '../schemas/product.schema.js';
import { Customer, CustomerDocument } from '../schemas/customer.schema.js';
import { Sale, SaleDocument } from '../schemas/sale.schema.js';
import { Debt, DebtDocument } from '../schemas/debt.schema.js';
import { Payment, PaymentDocument } from '../schemas/payment.schema.js';
import { StorageUsage, StorageUsageDocument } from '../schemas/storage-usage.schema.js';
import { Expense, ExpenseDocument } from '../schemas/expense.schema.js';
import { Receipt, ReceiptDocument } from '../schemas/receipt.schema.js';
import { PlatformRole, BusinessRole, TenantStatus, UserStatus, PaymentMethod, SaleType, DebtStatus, ReceiptType } from '../common/constants/roles.enum.js';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(Debt.name) private debtModel: Model<DebtDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(StorageUsage.name) private storageUsageModel: Model<StorageUsageDocument>,
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(Receipt.name) private receiptModel: Model<ReceiptDocument>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedInitialData();
  }

  async seedInitialData() {
    const existingSuperAdmin = await this.userModel.findOne({ platformRole: PlatformRole.SUPER_ADMIN });
    if (existingSuperAdmin) {
      console.log('⚡ Super Admin already initialized.');
      return;
    }

    console.log('🚀 Initializing Maraayn Management System default platform data...');

    const salt = await bcrypt.genSalt(10);

    // 1. Super Admin
    const superAdminPassword = await bcrypt.hash('yDnSl700', salt);
    const superAdmin = await this.userModel.create({
      name: 'Anas Abdiwahid (Super Admin)',
      email: 'anasabdiwahidhussein@gmail.com',
      username: 'anasabdiwahidhussein@gmail.com',
      phone: '+252615000001',
      passwordHash: superAdminPassword,
      platformRole: PlatformRole.SUPER_ADMIN,
      permissions: ['ALL'],
      status: UserStatus.ACTIVE,
    });

    // 2. Admin
    const adminPassword = await bcrypt.hash('Admin@2026', salt);
    await this.userModel.create({
      name: 'Operations Manager',
      email: 'admin@maraayn.com',
      username: 'admin',
      phone: '+252615000002',
      passwordHash: adminPassword,
      platformRole: PlatformRole.ADMIN,
      permissions: ['MARKETS_VIEW', 'MARKETS_MANAGE', 'REPORTS_VIEW', 'SETTINGS_VIEW'],
      status: UserStatus.ACTIVE,
    });

    // 3. Demo Tenant 1: Al-Baraka Supermarket
    const tenant1 = await this.tenantModel.create({
      name: 'Al-Baraka Supermarket',
      businessCode: 'BARAKA-101',
      category: 'Supermarket',
      ownerName: 'Faarax Axmed Cali',
      ownerEmail: 'albaraka@maraayn.com',
      ownerPhone: '+252615112233',
      location: 'KM4, Hodan, Mogadishu',
      address: 'Maka Al-Mukarama Street',
      country: 'Somalia',
      logoUrl: '/logo.png',
      primaryColor: '#142746',
      accentColor: '#E6AE43',
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'Africa/Mogadishu',
      storageQuotaBytes: 4 * 1024 * 1024 * 1024, // 4 GB
      storageUsedBytes: 245 * 1024 * 1024, // 245 MB sample usage
      isOverQuota: false,
      status: TenantStatus.ACTIVE,
      subscriptionPlan: 'Growth Plan',
      subscriptionStartDate: new Date('2026-01-01'),
      receiptSettings: {
        receiptTitle: 'Al-Baraka Supermarket',
        footerMessage: 'Waad ku mahadsantahay booqashadaada Al-Baraka!',
        showPhone: true,
        showAddress: true,
        showLogo: true,
        paperSize: 'thermal-80mm',
      },
    });

    await this.storageUsageModel.create({
      tenantId: tenant1._id,
      totalBytes: 245 * 1024 * 1024,
      files: [
        {
          fileKey: 'logo-baraka.png',
          originalName: 'albaraka-logo.png',
          sizeBytes: 1048576,
          category: 'logo',
          url: '/logo.png',
          uploadedAt: new Date(),
        },
      ],
    });

    // Owner for Tenant 1
    const owner1Password = await bcrypt.hash('Baraka@2026', salt);
    const ownerUser1 = await this.userModel.create({
      name: 'Faarax Axmed Cali',
      email: 'albaraka@maraayn.com',
      username: 'albaraka',
      phone: '+252615112233',
      passwordHash: owner1Password,
      platformRole: PlatformRole.BUSINESS_USER,
      tenantId: tenant1._id,
      businessRole: BusinessRole.OWNER,
      permissions: ['ALL'],
      status: UserStatus.ACTIVE,
    });

    // 4. Products for Al-Baraka
    const p1 = await this.productModel.create({
      tenantId: tenant1._id,
      name: 'Bariis Basmati 25kg (Al-Wazir)',
      sku: 'BAR-RICE-25KG',
      barcode: '6001234567891',
      category: 'Grains & Rice',
      purchaseCost: 24.5,
      sellingPrice: 31.0,
      currentQuantity: 45,
      minStockAlert: 10,
      unit: 'bag',
      supplier: 'Al-Khaleej Trading',
      status: 'ACTIVE',
    });

    const p2 = await this.productModel.create({
      tenantId: tenant1._id,
      name: 'Saliid Cadceed 5L (Sun Oil)',
      sku: 'BAR-OIL-5L',
      barcode: '6001234567892',
      category: 'Oils & Fats',
      purchaseCost: 8.5,
      sellingPrice: 11.5,
      currentQuantity: 30,
      minStockAlert: 8,
      unit: 'jerrycan',
      supplier: 'Horyaal Supplies',
      status: 'ACTIVE',
    });

    const p3 = await this.productModel.create({
      tenantId: tenant1._id,
      name: 'Sonkor Brazilian 50kg',
      sku: 'BAR-SUG-50KG',
      barcode: '6001234567893',
      category: 'Sugar & Flour',
      purchaseCost: 38.0,
      sellingPrice: 45.0,
      currentQuantity: 4, // LOW STOCK to demo alerts!
      minStockAlert: 10,
      unit: 'bag',
      supplier: 'Global Imports',
      status: 'ACTIVE',
    });

    const p4 = await this.productModel.create({
      tenantId: tenant1._id,
      name: 'Caano Boore Nido 2.5kg',
      sku: 'BAR-MILK-NIDO',
      barcode: '6001234567894',
      category: 'Dairy & Beverages',
      purchaseCost: 20.0,
      sellingPrice: 25.0,
      currentQuantity: 28,
      minStockAlert: 5,
      unit: 'can',
      supplier: 'Nestle Distributor',
      status: 'ACTIVE',
    });

    // 5. Customers for Al-Baraka
    const c1 = await this.customerModel.create({
      tenantId: tenant1._id,
      name: 'Jaamac Cumar Xasan',
      phone: '+252615554433',
      email: 'jaamac@gmail.com',
      address: 'Waberi, Mogadishu',
      code: 'CUS-1001',
      openingBalance: 0,
      currentDebtBalance: 42.5, // Active debt
      totalPurchases: 185.0,
      totalPaid: 142.5,
      notes: 'Macmiil joogto ah oo dayn qaata bil kasta',
      status: 'ACTIVE',
    });

    const c2 = await this.customerModel.create({
      tenantId: tenant1._id,
      name: 'Safiyo Cabdi Maxamed',
      phone: '+252615998877',
      email: 'safiyo@gmail.com',
      address: 'Hodan, Mogadishu',
      code: 'CUS-1002',
      openingBalance: 0,
      currentDebtBalance: 31.0, // Active debt
      totalPurchases: 110.0,
      totalPaid: 79.0,
      status: 'ACTIVE',
    });

    const c3 = await this.customerModel.create({
      tenantId: tenant1._id,
      name: 'Cabdullaahi Nuur Guuleed',
      phone: '+252615223344',
      code: 'CUS-1003',
      openingBalance: 0,
      currentDebtBalance: 0, // Cleared debt
      totalPurchases: 320.0,
      totalPaid: 320.0,
      status: 'ACTIVE',
    });

    // 6. Credit Sale and Debt Record for Jaamac
    const sale1 = await this.saleModel.create({
      tenantId: tenant1._id,
      saleNumber: 'SALE-2026-1001',
      customerId: c1._id,
      customerName: c1.name,
      customerPhone: c1.phone,
      items: [
        {
          productId: p1._id,
          productName: p1.name,
          sku: p1.sku,
          unitPrice: 31.0,
          costPrice: 24.5,
          quantity: 1,
          discount: 0,
          total: 31.0,
        },
        {
          productId: p2._id,
          productName: p2.name,
          sku: p2.sku,
          unitPrice: 11.5,
          costPrice: 8.5,
          quantity: 1,
          discount: 0,
          total: 11.5,
        },
      ],
      subtotal: 42.5,
      totalDiscount: 0,
      grandTotal: 42.5,
      amountPaid: 0, // fully on credit
      balanceDue: 42.5,
      paymentMethod: PaymentMethod.CASH,
      saleType: SaleType.CREDIT_SALE,
      paymentStatus: 'UNPAID',
      receiptNumber: 'RCP-1001',
      notes: 'Dayn bisha dhammaadkeeda la bixinayo',
      createdBy: ownerUser1._id,
    });

    await this.debtModel.create({
      tenantId: tenant1._id,
      debtNumber: 'DBT-1001',
      customerId: c1._id,
      saleId: sale1._id,
      saleDate: new Date(),
      totalSaleAmount: 42.5,
      initialPayment: 0,
      amountRepaid: 0,
      remainingBalance: 42.5,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: DebtStatus.UNPAID,
      transactionHistory: [],
      notes: 'Dayn iibka SALE-2026-1001',
    });

    await this.receiptModel.create({
      tenantId: tenant1._id,
      receiptNumber: 'RCP-1001',
      receiptType: ReceiptType.CREDIT_SALE,
      referenceId: sale1._id,
      customerName: c1.name,
      customerPhone: c1.phone,
      items: sale1.items,
      subtotal: 42.5,
      grandTotal: 42.5,
      amountPaid: 0,
      balanceRemaining: 42.5,
      paymentMethod: 'CREDIT',
    });

    // 7. Cash Sale Example
    const sale2 = await this.saleModel.create({
      tenantId: tenant1._id,
      saleNumber: 'SALE-2026-1002',
      customerName: 'Walk-in Customer',
      items: [
        {
          productId: p4._id,
          productName: p4.name,
          sku: p4.sku,
          unitPrice: 25.0,
          costPrice: 20.0,
          quantity: 2,
          discount: 0,
          total: 50.0,
        },
      ],
      subtotal: 50.0,
      totalDiscount: 0,
      grandTotal: 50.0,
      amountPaid: 50.0,
      balanceDue: 0,
      paymentMethod: PaymentMethod.MOBILE_MONEY,
      saleType: SaleType.CASH_SALE,
      paymentStatus: 'PAID',
      receiptNumber: 'RCP-1002',
      createdBy: ownerUser1._id,
    });

    await this.paymentModel.create({
      tenantId: tenant1._id,
      paymentNumber: 'PMT-1002',
      saleId: sale2._id,
      amount: 50.0,
      paymentMethod: PaymentMethod.MOBILE_MONEY,
      paymentDate: new Date(),
      reference: 'EVC Plus 0615550000',
      receiptNumber: 'RCP-1002',
      recordedBy: ownerUser1._id,
    });

    await this.receiptModel.create({
      tenantId: tenant1._id,
      receiptNumber: 'RCP-1002',
      receiptType: ReceiptType.CASH_SALE,
      referenceId: sale2._id,
      customerName: 'Walk-in Customer',
      items: sale2.items,
      subtotal: 50.0,
      grandTotal: 50.0,
      amountPaid: 50.0,
      balanceRemaining: 0,
      paymentMethod: 'MOBILE_MONEY',
    });

    // 8. Sample Expenses for Al-Baraka
    await this.expenseModel.create({
      tenantId: tenant1._id,
      title: 'Kirada Dukaanka (Shop Rent)',
      category: 'Rent',
      amount: 450.0,
      expenseDate: new Date(),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      description: 'Kirada bishan Maka Al-Mukarama',
      recordedBy: ownerUser1._id,
    });

    await this.expenseModel.create({
      tenantId: tenant1._id,
      title: 'Biilka Korontada (Becos)',
      category: 'Utilities',
      amount: 85.0,
      expenseDate: new Date(),
      paymentMethod: PaymentMethod.MOBILE_MONEY,
      description: 'Korontada dukaanka',
      recordedBy: ownerUser1._id,
    });

    // 9. Demo Tenant 2: Shaafi Pharmacy
    const tenant2 = await this.tenantModel.create({
      name: 'Shaafi Pharmacy',
      businessCode: 'SHAAFI-202',
      category: 'Pharmacy',
      ownerName: 'Dr. Maryan Yuusuf',
      ownerEmail: 'shaafi@maraayn.com',
      ownerPhone: '+252615778899',
      location: 'Taleex, Mogadishu',
      country: 'Somalia',
      logoUrl: '/logo.png',
      primaryColor: '#0E1C33',
      accentColor: '#16A34A',
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'Africa/Mogadishu',
      storageQuotaBytes: 4 * 1024 * 1024 * 1024,
      storageUsedBytes: 120 * 1024 * 1024,
      status: TenantStatus.ACTIVE,
      subscriptionPlan: 'Professional Plan',
    });

    const owner2Password = await bcrypt.hash('Shaafi@2026', salt);
    await this.userModel.create({
      name: 'Dr. Maryan Yuusuf',
      email: 'shaafi@maraayn.com',
      username: 'shaafi',
      phone: '+252615778899',
      passwordHash: owner2Password,
      platformRole: PlatformRole.BUSINESS_USER,
      tenantId: tenant2._id,
      businessRole: BusinessRole.OWNER,
      permissions: ['ALL'],
      status: UserStatus.ACTIVE,
    });

    console.log('✅ Maraayn Management System successfully seeded with SuperAdmin, Admin, and demo businesses.');
  }
}

