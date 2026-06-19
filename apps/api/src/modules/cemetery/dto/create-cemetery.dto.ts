import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCemeteryDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(200)
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'Endereço é obrigatório' })
  @MaxLength(300)
  endereco: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  bairro?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  areaM2?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  capacidade?: number;
}
