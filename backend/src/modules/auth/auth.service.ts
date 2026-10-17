import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../schemas/user.schema.js';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema.js';
import { LoginDto } from './dto/login.dto.js';
import { PlatformRole, TenantStatus, UserStatus } from '../../common/constants/roles.enum.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<UserDocument> {
    const cleanId = identifier.trim().toLowerCase();
    const user = await this.userModel.findOne({
      $or: [{ email: cleanId }, { username: cleanId }],
    }).exec();

    if (!user) {
      throw new UnauthorizedException('Email/Username ama Furaha Sirta ah waa qalad');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Akoonkaaga waa la xannibay ama la damiyay. Fadlan la xiriir maamulka.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email/Username ama Furaha Sirta ah waa qalad');
    }

    // If business user, check tenant status
    if (user.platformRole === PlatformRole.BUSINESS_USER && user.tenantId) {
      const tenant = await this.tenantModel.findById(user.tenantId).exec();
      if (!tenant) {
        throw new ForbiddenException('Ganacsiga akoonkani ku xiran yahay lama helin');
      }
      if (tenant.status === TenantStatus.DISABLED) {
        throw new ForbiddenException('Ganacsigan waa la damiyay (Disabled). Fadlan la xiriir Maraayn Support.');
      }
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.loginIdentifier, loginDto.password);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    let tenantData: any = null;
    if (user.tenantId) {
      tenantData = await this.tenantModel.findById(user.tenantId).exec();
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      platformRole: user.platformRole,
      tenantId: user.tenantId ? user.tenantId.toString() : null,
      businessRole: user.businessRole || null,
      permissions: user.permissions || [],
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '8h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // Save hashed refresh token
    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        platformRole: user.platformRole,
        businessRole: user.businessRole,
        tenantId: user.tenantId,
        permissions: user.permissions,
        status: user.status,
      },
      tenant: tenantData
        ? {
            id: tenantData._id,
            name: tenantData.name,
            businessCode: tenantData.businessCode,
            category: tenantData.category,
            logoUrl: tenantData.logoUrl,
            primaryColor: tenantData.primaryColor,
            accentColor: tenantData.accentColor,
            currency: tenantData.currency,
            currencySymbol: tenantData.currencySymbol,
            timezone: tenantData.timezone,
            status: tenantData.status,
            storageQuotaBytes: tenantData.storageQuotaBytes,
            storageUsedBytes: tenantData.storageUsedBytes,
            isOverQuota: tenantData.isOverQuota,
            receiptSettings: tenantData.receiptSettings,
          }
        : null,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.userModel.findById(decoded.sub).exec();
      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh session');
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isValid) {
        throw new UnauthorizedException('Refresh token revoked');
      }

      const payload = {
        sub: user._id.toString(),
        email: user.email,
        name: user.name,
        platformRole: user.platformRole,
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        businessRole: user.businessRole || null,
      };

      const newAccessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Session expired, please log in again');
    }
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: null });
    return { success: true, message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash -refreshTokenHash').exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    let tenant = null;
    if (user.tenantId) {
      tenant = await this.tenantModel.findById(user.tenantId).exec();
    }

    return { user, tenant };
  }
}

