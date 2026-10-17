import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, BUSINESS_ROLES_KEY } from '../decorators/roles.decorator.js';
import { PlatformRole } from '../constants/roles.enum.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(PlatformRole | string)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredBusinessRoles = this.reflector.getAllAndOverride<string[]>(BUSINESS_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredBusinessRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User session not found');
    }

    // Super Admin has universal access
    if (user.platformRole === PlatformRole.SUPER_ADMIN) {
      return true;
    }

    // Check platform role if specified
    if (requiredRoles && requiredRoles.length > 0) {
      const hasPlatformRole = requiredRoles.includes(user.platformRole);
      if (!hasPlatformRole) {
        throw new ForbiddenException('You do not have the required platform role for this operation');
      }
    }

    // Check business role if specified
    if (requiredBusinessRoles && requiredBusinessRoles.length > 0) {
      if (!user.businessRole || !requiredBusinessRoles.includes(user.businessRole)) {
        throw new ForbiddenException('Your business role does not permit this action');
      }
    }

    return true;
  }
}

