import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '@prisma/client';

export class QueryDocumentDto {
  @IsString()
  @IsOptional()
  entidadeTipo?: string;

  @IsString()
  @IsOptional()
  entidadeId?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  tipo?: DocumentType;

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
