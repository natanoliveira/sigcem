import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityStatus } from '@prisma/client';

export class QueryQuadraDto {
  @IsString()
  @IsOptional()
  cemiterioId?: string;

  @IsEnum(EntityStatus)
  @IsOptional()
  status?: EntityStatus;

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
