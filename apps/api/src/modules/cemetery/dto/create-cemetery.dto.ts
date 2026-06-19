import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCemeteryDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Endereço é obrigatório' })
  @MaxLength(300)
  address: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  neighborhood?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  areaM2?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  capacity?: number;
}
