import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlatformRole, BusinessRole, UserStatus } from '../common/constants/roles.enum.js';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  username?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: PlatformRole, default: PlatformRole.BUSINESS_USER })
  platformRole: PlatformRole;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true, default: null })
  tenantId?: Types.ObjectId | null;

  @Prop({ type: String, enum: BusinessRole, default: null })
  businessRole?: BusinessRole | null;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop()
  avatarUrl?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  refreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ tenantId: 1, platformRole: 1 });

