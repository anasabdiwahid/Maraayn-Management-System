import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesService } from './sales.service.js';
import { SalesController } from './sales.controller.js';
import { Sale, SaleSchema } from '../../schemas/sale.schema.js';
import { Product, ProductSchema } from '../../schemas/product.schema.js';
import { Customer, CustomerSchema } from '../../schemas/customer.schema.js';
import { Debt, DebtSchema } from '../../schemas/debt.schema.js';
import { Payment, PaymentSchema } from '../../schemas/payment.schema.js';
import { Receipt, ReceiptSchema } from '../../schemas/receipt.schema.js';
import { InventoryMovement, InventoryMovementSchema } from '../../schemas/inventory-movement.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Debt.name, schema: DebtSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Receipt.name, schema: ReceiptSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService, MongooseModule],
})
export class SalesModule {}

