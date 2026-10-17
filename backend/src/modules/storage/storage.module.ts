import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageService } from './storage.service.js';
import { StorageController } from './storage.controller.js';
import { StorageUsage, StorageUsageSchema } from '../../schemas/storage-usage.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';
import { Notification, NotificationSchema } from '../../schemas/notification.schema.js';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StorageUsage.name, schema: StorageUsageSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}

