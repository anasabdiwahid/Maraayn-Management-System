import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReceiptsService } from './receipts.service.js';
import { ReceiptsController } from './receipts.controller.js';
import { Receipt, ReceiptSchema } from '../../schemas/receipt.schema.js';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}

