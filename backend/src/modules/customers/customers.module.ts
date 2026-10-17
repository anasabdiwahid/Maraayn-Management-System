import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersService } from './customers.service.js';
import { CustomersController } from './customers.controller.js';
import { Customer, CustomerSchema } from '../../schemas/customer.schema.js';
import { Sale, SaleSchema } from '../../schemas/sale.schema.js';
import { Debt, DebtSchema } from '../../schemas/debt.schema.js';
import { Payment, PaymentSchema } from '../../schemas/payment.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: Debt.name, schema: DebtSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService, MongooseModule],
})
export class CustomersModule {}

