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
  fullName: string;

  @IsDateString()
  birthDate: string;

  @IsDateString()
  deathDate: string;

  // Campo sensível LGPD — será criptografado antes de persistir
  @IsString()
  @IsOptional()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido' })
  cpf?: string;

  // Campo sensível LGPD — será criptografado antes de persistir
  @IsString()
  @IsOptional()
  @MaxLength(500)
  causeOfDeath?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  birthPlace?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nationality?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  fatherName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  motherName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
