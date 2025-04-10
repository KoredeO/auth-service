import { SetMetadata } from '@nestjs/common';
import { Role, Permission } from './role.enum';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...permissions: Permission[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);
