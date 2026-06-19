import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { GraveType } from '@prisma/client';

export class CreateGraveDto {
  @IsString()
  @IsNotEmpty({ message: 'Quadra é obrigatória' })
  blockId: string;

  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @MaxLength(20)
  code: string;

  @IsEnum(GraveType)
  type: GraveType;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  locationRef?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
