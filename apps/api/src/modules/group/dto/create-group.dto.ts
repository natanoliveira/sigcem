import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  description?: string;
}
