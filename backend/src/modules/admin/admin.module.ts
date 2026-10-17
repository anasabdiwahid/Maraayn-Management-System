import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';
import { User, UserSchema } from '../../schemas/user.schema.js';
import { StorageUsage, StorageUsageSchema } from '../../schemas/storage-usage.schema.js';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema.js';
import { Product, ProductSchema } from '../../schemas/product.schema.js';
import { Sale, SaleSchema } from '../../schemas/sale.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: StorageUsage.name, schema: StorageUsageSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Sale.name, schema: SaleSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

