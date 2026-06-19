import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDeceasedDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsDateString()
  @IsOptional()
  deathDateStart?: string;

  @IsDateString()
  @IsOptional()
  deathDateEnd?: string;

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
