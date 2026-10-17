import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DebtsService } from './debts.service.js';
import { DebtsController } from './debts.controller.js';
import { Debt, DebtSchema } from '../../schemas/debt.schema.js';
import { Customer, CustomerSchema } from '../../schemas/customer.schema.js';
import { Payment, PaymentSchema } from '../../schemas/payment.schema.js';
import { Receipt, ReceiptSchema } from '../../schemas/receipt.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Debt.name, schema: DebtSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [DebtsController],
  providers: [DebtsService],
  exports: [DebtsService, MongooseModule],
})
export class DebtsModule {}

