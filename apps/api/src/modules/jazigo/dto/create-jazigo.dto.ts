import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { JazigoType } from '@prisma/client';

export class CreateJazigoDto {
  @IsString()
  @IsNotEmpty({ message: 'Quadra é obrigatória' })
  quadraId: string;

  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @MaxLength(20)
  codigo: string;

  @IsEnum(JazigoType)
  tipo: JazigoType;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  localizacaoRef?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
