import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true, default: null })
  tenantId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ trim: true })
  userName?: string;

  @Prop({ trim: true })
  userRole?: string;

  @Prop({ required: true, trim: true })
  action: string;

  @Prop({ required: true, trim: true })
  resource: string;

  @Prop({ trim: true })
  resourceId?: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>;

  @Prop({ trim: true })
  ipAddress?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

