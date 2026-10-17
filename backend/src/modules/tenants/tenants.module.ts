import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantController } from './tenant.controller.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';
import { User, UserSchema } from '../../schemas/user.schema.js';
import { StorageUsage, StorageUsageSchema } from '../../schemas/storage-usage.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: StorageUsage.name, schema: StorageUsageSchema },
    ]),
  ],
  controllers: [TenantController],
  exports: [MongooseModule],
})
export class TenantsModule {}

