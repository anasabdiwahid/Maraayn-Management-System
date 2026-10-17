import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  sku: string;

  @Prop({ trim: true })
  barcode?: string;

  @Prop({ default: 'General' })
  category: string;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true, default: 0 })
  purchaseCost: number;

  @Prop({ required: true, default: 0 })
  sellingPrice: number;

  @Prop({ required: true, default: 0 })
  currentQuantity: number;

  @Prop({ default: 5 })
  minStockAlert: number;

  @Prop({ default: 'pcs' })
  unit: string;

  @Prop({ trim: true })
  supplier?: string;

  @Prop()
  expiryDate?: Date;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'ARCHIVED'] })
  status: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ tenantId: 1, name: 1 });
ProductSchema.index({ tenantId: 1, sku: 1 });
ProductSchema.index({ tenantId: 1, barcode: 1 });
ProductSchema.index({ tenantId: 1, currentQuantity: 1 });
ProductSchema.index({ tenantId: 1, status: 1 });

