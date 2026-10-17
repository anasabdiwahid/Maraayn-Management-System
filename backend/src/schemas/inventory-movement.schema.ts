import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InventoryMovementType } from '../common/constants/roles.enum.js';

export type InventoryMovementDocument = InventoryMovement & Document;

@Schema({ timestamps: true })
export class InventoryMovement {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: String, enum: InventoryMovementType, required: true })
  type: InventoryMovementType;

  @Prop({ required: true })
  quantityDelta: number; // positive for addition, negative for deduction

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ trim: true })
  reason: string;

  @Prop({ type: Types.ObjectId })
  referenceId?: Types.ObjectId; // SaleId or PurchaseId

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const InventoryMovementSchema = SchemaFactory.createForClass(InventoryMovement);
InventoryMovementSchema.index({ tenantId: 1, productId: 1, createdAt: -1 });

