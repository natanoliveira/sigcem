import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateTransladoDto {
  @IsString()
  @IsNotEmpty()
  falecidoId: string;

  @IsString()
  @IsNotEmpty()
  jazigoOrigemId: string;

  @IsString()
  @IsNotEmpty()
  jazigoDestinoId: string;

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
