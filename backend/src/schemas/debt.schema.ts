import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DebtStatus, PaymentMethod } from '../common/constants/roles.enum.js';

export type DebtDocument = Debt & Document;

@Schema({ _id: false })
export class DebtPaymentHistory {
  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: () => new Date() })
  date: Date;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.CASH })
  method: PaymentMethod;

  @Prop()
  reference?: string;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy?: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Debt {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, index: true })
  debtNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sale', required: true, index: true })
  saleId: Types.ObjectId;

  @Prop({ default: () => new Date() })
  saleDate: Date;

  @Prop({ required: true })
  totalSaleAmount: number;

  @Prop({ default: 0 })
  initialPayment: number;

  @Prop({ default: 0 })
  amountRepaid: number;

  @Prop({ required: true })
  remainingBalance: number;

  @Prop()
  dueDate?: Date;

  @Prop({ type: String, enum: DebtStatus, default: DebtStatus.UNPAID })
  status: DebtStatus;

  @Prop({ type: [DebtPaymentHistory], default: [] })
  transactionHistory: DebtPaymentHistory[];

  @Prop({ trim: true })
  notes?: string;
}

export const DebtSchema = SchemaFactory.createForClass(Debt);
DebtSchema.index({ tenantId: 1, customerId: 1 });
DebtSchema.index({ tenantId: 1, status: 1 });
DebtSchema.index({ tenantId: 1, remainingBalance: -1 });
DebtSchema.index({ tenantId: 1, dueDate: 1 });

