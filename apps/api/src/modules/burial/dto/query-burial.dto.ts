import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BurialType } from '@prisma/client';

export class QueryBurialDto {
  @IsString()
  @IsOptional()
  falecidoId?: string;

  @IsString()
  @IsOptional()
  jazigoId?: string;

  @IsEnum(BurialType)
  @IsOptional()
  tipo?: BurialType;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

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
