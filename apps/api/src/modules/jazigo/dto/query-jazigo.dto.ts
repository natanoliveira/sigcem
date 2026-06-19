import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JazigoStatus, JazigoType } from '@prisma/client';

export class QueryJazigoDto {
  @IsString()
  @IsOptional()
  quadraId?: string;

  @IsString()
  @IsOptional()
  cemiterioId?: string;

  @IsEnum(JazigoStatus)
  @IsOptional()
  status?: JazigoStatus;

  @IsEnum(JazigoType)
  @IsOptional()
  tipo?: JazigoType;

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
