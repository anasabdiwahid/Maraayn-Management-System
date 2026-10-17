import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller.js';
import { Payment, PaymentSchema } from '../../schemas/payment.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [PaymentsController],
  exports: [MongooseModule],
})
export class PaymentsModule {}

