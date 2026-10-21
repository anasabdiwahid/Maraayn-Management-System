import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller.js';
import { Payment, PaymentSchema } from '../../schemas/payment.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';
import { Sale, SaleSchema } from '../../schemas/sale.schema.js';
import { Receipt, ReceiptSchema } from '../../schemas/receipt.schema.js';
import { Debt, DebtSchema } from '../../schemas/debt.schema.js';
import { Customer, CustomerSchema } from '../../schemas/customer.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Debt.name, schema: DebtSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [PaymentsController],
  exports: [MongooseModule],
})
export class PaymentsModule {}

