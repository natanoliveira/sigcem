import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BurialType } from '@prisma/client';

export class QueryBurialDto {
  @IsString()
  @IsOptional()
  deceasedId?: string;

  @IsString()
  @IsOptional()
  graveId?: string;

  @IsEnum(BurialType)
  @IsOptional()
  type?: BurialType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
