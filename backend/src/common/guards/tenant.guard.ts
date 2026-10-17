import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema.js';
import { PlatformRole, TenantStatus } from '../constants/roles.enum.js';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Platform Super Admin and Admin can access with explicit tenant context if provided, or bypass for global ops
    if (user.platformRole === PlatformRole.SUPER_ADMIN || user.platformRole === PlatformRole.ADMIN) {
      // If a specific tenantId is passed in header or query for admin inspection:
      const requestedTenantId = request.headers['x-tenant-id'] || request.query.tenantId;
      if (requestedTenantId) {
        const tenant = await this.tenantModel.findById(requestedTenantId).exec();
        if (tenant) {
          request.tenant = tenant;
          request.tenantId = tenant._id;
        }
      }
      return true;
    }

    // Business users MUST have a valid tenantId
    if (!user.tenantId) {
      throw new ForbiddenException('User is not associated with any registered business');
    }

    const tenant = await this.tenantModel.findById(user.tenantId).exec();
    if (!tenant) {
      throw new ForbiddenException('Registered business was not found');
    }

    // Verify tenant status
    if (tenant.status === TenantStatus.SUSPENDED) {
      // Allow only GET requests for read-only / billing inspection if configured, otherwise block write ops
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        throw new ForbiddenException(
          `Ganacsigaagu wuxuu ku jiraa xaalad ganaax (SUSPENDED): ${tenant.suspensionReason || 'Storage quota exceeded or administrative suspension'}. Fadlan la xiriir maamulka.`,
        );
      }
    } else if (tenant.status === TenantStatus.DISABLED) {
      throw new ForbiddenException('Akoonka ganacsigan waa la damiyay (DISABLED). Fadlan la xiriir maamulka Maraayn.');
    }

    // Attach verified tenant to request
    request.tenant = tenant;
    request.tenantId = tenant._id;

    return true;
  }
}

