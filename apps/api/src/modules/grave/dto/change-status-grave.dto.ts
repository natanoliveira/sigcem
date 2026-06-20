import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GraveStatus } from '@prisma/client';

export class ChangeStatusGraveDto {
  @IsEnum(GraveStatus)
  status: GraveStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
