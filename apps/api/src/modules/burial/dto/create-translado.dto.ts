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
  deceasedId: string;

  @IsString()
  @IsNotEmpty()
  sourceGraveId: string;

  @IsString()
  @IsNotEmpty()
  targetGraveId: string;

  @IsDateString()
  eventDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Responsável pela autorização é obrigatório' })
  @MaxLength(200)
  authorizedBy: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  funeralHome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  responsibleName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  responsibleTaxId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
