import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  code?: string;

  @Prop({ default: 0 })
  openingBalance: number;

  @Prop({ default: 0 })
  currentDebtBalance: number;

  @Prop({ default: 0 })
  totalPurchases: number;

  @Prop({ default: 0 })
  totalPaid: number;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'ARCHIVED'] })
  status: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ tenantId: 1, phone: 1 });
CustomerSchema.index({ tenantId: 1, name: 1 });
CustomerSchema.index({ tenantId: 1, currentDebtBalance: -1 });

