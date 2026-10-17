import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentMethod } from '../common/constants/roles.enum.js';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, index: true })
  paymentNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Sale', default: null })
  saleId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Debt', default: null, index: true })
  debtId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Customer', default: null, index: true })
  customerId?: Types.ObjectId | null;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Prop({ default: () => new Date() })
  paymentDate: Date;

  @Prop({ trim: true })
  reference?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ required: true })
  receiptNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy?: Types.ObjectId;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ tenantId: 1, createdAt: -1 });
PaymentSchema.index({ tenantId: 1, debtId: 1 });
PaymentSchema.index({ tenantId: 1, customerId: 1 });

