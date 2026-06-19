import { IsEnum, IsOptional, IsString } from 'class-validator';
import { JazigoStatus } from '@prisma/client';

export class ChangeStatusJazigoDto {
  @IsEnum(JazigoStatus)
  status: JazigoStatus;

  @IsString()
  @IsOptional()
  motivo?: string;
}
