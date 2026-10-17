import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema.js';
import { Tenant, TenantSchema } from './schemas/tenant.schema.js';
import { Product, ProductSchema } from './schemas/product.schema.js';
import { Customer, CustomerSchema } from './schemas/customer.schema.js';
import { Sale, SaleSchema } from './schemas/sale.schema.js';
import { Debt, DebtSchema } from './schemas/debt.schema.js';
import { Payment, PaymentSchema } from './schemas/payment.schema.js';
import { Expense, ExpenseSchema } from './schemas/expense.schema.js';
import { Receipt, ReceiptSchema } from './schemas/receipt.schema.js';
import { StorageUsage, StorageUsageSchema } from './schemas/storage-usage.schema.js';
import { Notification, NotificationSchema } from './schemas/notification.schema.js';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema.js';
import { InventoryMovement, InventoryMovementSchema } from './schemas/inventory-movement.schema.js';

import { AuthModule } from './modules/auth/auth.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { TenantsModule } from './modules/tenants/tenants.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { SalesModule } from './modules/sales/sales.module.js';
import { DebtsModule } from './modules/debts/debts.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { ExpensesModule } from './modules/expenses/expenses.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { ReceiptsModule } from './modules/receipts/receipts.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';

import { SeedService } from './seed/seed.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/maraayn'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: Debt.name, schema: DebtSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Receipt.name, schema: ReceiptSchema },
      { name: StorageUsage.name, schema: StorageUsageSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
    ]),
    AuthModule,
    AdminModule,
    TenantsModule,
    ProductsModule,
    CustomersModule,
    SalesModule,
    DebtsModule,
    PaymentsModule,
    ExpensesModule,
    ReportsModule,
    ReceiptsModule,
    StorageModule,
    NotificationsModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
