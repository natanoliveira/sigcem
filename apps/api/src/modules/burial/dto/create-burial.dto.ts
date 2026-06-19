import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateBurialDto {
  @IsString()
  @IsNotEmpty()
  deceasedId: string;

  @IsString()
  @IsNotEmpty()
  graveId: string;

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
