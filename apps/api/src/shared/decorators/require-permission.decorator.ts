import { SetMetadata } from '@nestjs/common';
import { SystemModule, PermissionAction } from '@prisma/client';

export const PERMISSION_KEY = 'required_permission';

export interface RequiredPermission {
  module: SystemModule;
  action: PermissionAction;
}

export const RequirePermission = (module: SystemModule, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { module, action });
