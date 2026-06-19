import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GraveStatus, GraveType } from '@prisma/client';

export class QueryGraveDto {
  @IsString()
  @IsOptional()
  blockId?: string;

  @IsString()
  @IsOptional()
  cemeteryId?: string;

  @IsEnum(GraveStatus)
  @IsOptional()
  status?: GraveStatus;

  @IsEnum(GraveType)
  @IsOptional()
  type?: GraveType;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;
}
