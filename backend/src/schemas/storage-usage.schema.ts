import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StorageUsageDocument = StorageUsage & Document;

@Schema({ _id: false })
export class StoredFile {
  @Prop({ required: true })
  fileKey: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  sizeBytes: number;

  @Prop({ default: 'product', enum: ['logo', 'product', 'receipt', 'document', 'other'] })
  category: string;

  @Prop({ required: true })
  url: string;

  @Prop({ default: () => new Date() })
  uploadedAt: Date;
}

@Schema({ timestamps: true })
export class StorageUsage {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, unique: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ default: 0 })
  totalBytes: number;

  @Prop({ type: [StoredFile], default: [] })
  files: StoredFile[];
}

export const StorageUsageSchema = SchemaFactory.createForClass(StorageUsage);
StorageUsageSchema.index({ tenantId: 1 });

