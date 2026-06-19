import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuadraDto {
  @IsString()
  @IsNotEmpty({ message: 'Cemitério é obrigatório' })
  cemiterioId: string;

  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @MaxLength(20)
  codigo: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nome?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  capacidade?: number;
}
