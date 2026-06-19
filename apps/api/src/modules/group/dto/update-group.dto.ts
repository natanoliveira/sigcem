import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  description?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
