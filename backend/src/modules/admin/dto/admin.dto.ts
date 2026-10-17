import { IsNotEmpty, IsString, IsEmail, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { TenantStatus, PlatformRole, BusinessCategory } from '../../../common/constants/roles.enum.js';

export class CreateMarketDto {
  @IsNotEmpty({ message: 'Magaca ganacsiga waa loo baahan yahay' })
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  ownerName: string;

  @IsNotEmpty()
  @IsEmail()
  ownerEmail: string;

  @IsNotEmpty()
  @IsString()
  ownerPhone: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  currencySymbol?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  // Storage Quota in GB
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  storageQuotaGb?: number;

  @IsOptional()
  @IsEnum(TenantStatus)
  initialStatus?: TenantStatus;

  @IsOptional()
  @IsString()
  initialPassword?: string;
}

export class UpdateMarketDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  currencySymbol?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  storageQuotaGb?: number;
}

export class SuspendMarketDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(PlatformRole)
  platformRole?: PlatformRole;

  @IsOptional()
  permissions?: string[];
}

