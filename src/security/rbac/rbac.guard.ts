import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, Permission } from './role.enum';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    const requiredPermissions = this.reflector.get<Permission[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    if (requiredRoles && !this.matchRoles(requiredRoles, user.roles)) {
      return false;
    }

    if (requiredPermissions && !this.matchPermissions(requiredPermissions, user.permissions)) {
      return false;
    }

    return true;
  }

  private matchRoles(required: Role[], userRoles: Role[]): boolean {
    return required.some(role => userRoles.includes(role));
  }

  private matchPermissions(required: Permission[], userPermissions: Permission[]): boolean {
    return required.every(permission => userPermissions.includes(permission));
  }
}
