import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { Product, ProductSchema } from '../../schemas/product.schema.js';
import { InventoryMovement, InventoryMovementSchema } from '../../schemas/inventory-movement.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, MongooseModule],
})
export class ProductsModule {}

