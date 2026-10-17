import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentMethod, SaleType } from '../common/constants/roles.enum.js';

export type SaleDocument = Sale & Document;

@Schema({ _id: false })
export class SaleItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop()
  sku?: string;

  @Prop({ required: true, default: 0 })
  unitPrice: number;

  @Prop({ required: true, default: 0 })
  costPrice: number;

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true, default: 0 })
  total: number;
}

@Schema({ timestamps: true })
export class Sale {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, index: true })
  saleNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', index: true, default: null })
  customerId?: Types.ObjectId | null;

  @Prop({ default: 'Walk-in Customer' })
  customerName: string;

  @Prop()
  customerPhone?: string;

  @Prop({ type: [SaleItem], required: true })
  items: SaleItem[];

  @Prop({ required: true, default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  totalDiscount: number;

  @Prop({ required: true, default: 0 })
  grandTotal: number;

  @Prop({ required: true, default: 0 })
  amountPaid: number;

  @Prop({ required: true, default: 0 })
  balanceDue: number;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Prop({ type: String, enum: SaleType, default: SaleType.CASH_SALE })
  saleType: SaleType;

  @Prop({ default: 'PAID', enum: ['PAID', 'PARTIALLY_PAID', 'UNPAID'] })
  paymentStatus: string;

  @Prop({ required: true })
  receiptNumber: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
SaleSchema.index({ tenantId: 1, createdAt: -1 });
SaleSchema.index({ tenantId: 1, saleNumber: 1 });
SaleSchema.index({ tenantId: 1, receiptNumber: 1 });
SaleSchema.index({ tenantId: 1, saleType: 1 });
SaleSchema.index({ tenantId: 1, customerId: 1 });

