import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TenantStatus, BusinessCategory } from '../common/constants/roles.enum.js';

export type TenantDocument = Tenant & Document;

@Schema({ _id: false })
export class ReceiptSettings {
  @Prop({ default: 'Sales Receipt' })
  receiptTitle: string;

  @Prop({ default: 'Waad ku mahadsantahay ganacsigaaga!' })
  footerMessage: string;

  @Prop({ default: true })
  showPhone: boolean;

  @Prop({ default: true })
  showAddress: boolean;

  @Prop({ default: true })
  showLogo: boolean;

  @Prop({ default: 'thermal-80mm' })
  paperSize: string; // 'thermal-80mm' | 'thermal-58mm' | 'a4'
}

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  businessCode: string;

  @Prop({ type: String, default: BusinessCategory.RETAIL })
  category: string;

  @Prop({ required: true, trim: true })
  ownerName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  ownerEmail: string;

  @Prop({ required: true, trim: true })
  ownerPhone: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ default: 'Somalia' })
  country: string;

  @Prop({ default: '/logo.png' })
  logoUrl: string;

  @Prop({ default: '#142746' })
  primaryColor: string;

  @Prop({ default: '#E6AE43' })
  accentColor: string;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: '$' })
  currencySymbol: string;

  @Prop({ default: 'Africa/Mogadishu' })
  timezone: string;

  // Storage Quota in Bytes (default 4 GB)
  @Prop({ default: 4 * 1024 * 1024 * 1024 })
  storageQuotaBytes: number;

  @Prop({ default: 0 })
  storageUsedBytes: number;

  @Prop({ default: false })
  isOverQuota: boolean;

  @Prop({ type: String, enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  @Prop()
  suspensionReason?: string;

  @Prop()
  suspendedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  suspendedBy?: Types.ObjectId;

  @Prop({ default: 'Standard Business' })
  subscriptionPlan: string;

  @Prop({ default: () => new Date() })
  subscriptionStartDate: Date;

  @Prop()
  subscriptionEndDate?: Date;

  @Prop({ type: ReceiptSettings, default: () => ({}) })
  receiptSettings: ReceiptSettings;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
TenantSchema.index({ businessCode: 1 });
TenantSchema.index({ status: 1 });
TenantSchema.index({ ownerEmail: 1 });

