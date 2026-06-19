import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { BurialType } from '@prisma/client';

export class CreateBurialDto {
  @IsString()
  @IsNotEmpty()
  falecidoId: string;

  @IsString()
  @IsNotEmpty()
  jazigoId: string;

  @IsEnum(BurialType)
  tipo: BurialType;

  @IsDateString()
  dataEvento: string;

  @IsString()
  @IsNotEmpty({ message: 'Responsável pela autorização é obrigatório' })
  @MaxLength(200)
  autorizadoPor: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  funeraria?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  responsavelNome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  responsavelCpf?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
