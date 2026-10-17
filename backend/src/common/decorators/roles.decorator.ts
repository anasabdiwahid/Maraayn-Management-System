import { SetMetadata } from '@nestjs/common';
import { PlatformRole, BusinessRole } from '../constants/roles.enum.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (PlatformRole | string)[]) => SetMetadata(ROLES_KEY, roles);

export const BUSINESS_ROLES_KEY = 'business_roles';
export const BusinessRoles = (...roles: (BusinessRole | string)[]) => SetMetadata(BUSINESS_ROLES_KEY, roles);

