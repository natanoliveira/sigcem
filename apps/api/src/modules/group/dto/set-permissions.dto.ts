import { IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SystemModule, PermissionAction } from '@prisma/client';

export class PermissionEntryDto {
  @IsEnum(SystemModule)
  module: SystemModule;

  @IsArray()
  @IsEnum(PermissionAction, { each: true })
  actions: PermissionAction[];
}

export class SetPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionEntryDto)
  permissions: PermissionEntryDto[];
}
