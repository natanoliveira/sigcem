import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBlockDto {
  @IsString()
  @IsNotEmpty({ message: 'Cemitério é obrigatório' })
  cemeteryId: string;

  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @MaxLength(20)
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  capacity?: number;
}
