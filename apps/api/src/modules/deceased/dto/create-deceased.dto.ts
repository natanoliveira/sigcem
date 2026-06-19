import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateDeceasedDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @MaxLength(200)
  nomeCompleto: string;

  @IsDateString()
  dataNascimento: string;

  @IsDateString()
  dataFalecimento: string;

  // Campo sensível LGPD — será criptografado antes de persistir
  @IsString()
  @IsOptional()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido' })
  cpf?: string;

  // Campo sensível LGPD — será criptografado antes de persistir
  @IsString()
  @IsOptional()
  @MaxLength(500)
  causaMortis?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  naturalidade?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nacionalidade?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nomePai?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nomeMae?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
