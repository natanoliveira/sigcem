import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { EntityStatus } from '@prisma/client';
import { CreateQuadraDto } from './create-quadra.dto';

export class UpdateQuadraDto extends PartialType(OmitType(CreateQuadraDto, ['cemiterioId'] as const)) {
  @IsEnum(EntityStatus)
  @IsOptional()
  status?: EntityStatus;
}
