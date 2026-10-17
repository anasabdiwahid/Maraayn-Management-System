import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReceiptType } from '../common/constants/roles.enum.js';

export type ReceiptDocument = Receipt & Document;

@Schema({ timestamps: true })
export class Receipt {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, index: true })
  receiptNumber: string;

  @Prop({ type: String, enum: ReceiptType, required: true })
  receiptType: ReceiptType;

  @Prop({ type: Types.ObjectId })
  referenceId?: Types.ObjectId;

  @Prop()
  customerName?: string;

  @Prop()
  customerPhone?: string;

  @Prop({ type: Array, default: [] })
  items: any[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  grandTotal: number;

  @Prop({ default: 0 })
  amountPaid: number;

  @Prop({ default: 0 })
  balanceRemaining: number;

  @Prop()
  paymentMethod?: string;

  @Prop()
  renderedPdfUrl?: string;

  @Prop()
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);
ReceiptSchema.index({ tenantId: 1, receiptNumber: 1 });
ReceiptSchema.index({ tenantId: 1, createdAt: -1 });

