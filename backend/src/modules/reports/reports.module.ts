import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';
import { Sale, SaleSchema } from '../../schemas/sale.schema.js';
import { Product, ProductSchema } from '../../schemas/product.schema.js';
import { Customer, CustomerSchema } from '../../schemas/customer.schema.js';
import { Debt, DebtSchema } from '../../schemas/debt.schema.js';
import { Payment, PaymentSchema } from '../../schemas/payment.schema.js';
import { Expense, ExpenseSchema } from '../../schemas/expense.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Debt.name, schema: DebtSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

