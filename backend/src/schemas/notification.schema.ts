import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true, default: null })
  tenantId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true, default: null })
  userId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    required: true,
    enum: [
      'LOW_STOCK',
      'CREDIT_SALE',
      'DEBT_OVERDUE',
      'PAYMENT_RECEIVED',
      'STORAGE_80',
      'STORAGE_90',
      'STORAGE_100',
      'BUSINESS_SUSPENDED',
      'BUSINESS_REACTIVATED',
      'SYSTEM',
    ],
  })
  type: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  link?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ tenantId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

