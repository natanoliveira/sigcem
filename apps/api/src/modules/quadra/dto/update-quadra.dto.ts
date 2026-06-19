import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { EntityStatus } from '@prisma/client';
import { CreateBlockDto } from './create-quadra.dto';

export class UpdateBlockDto extends PartialType(OmitType(CreateBlockDto, ['cemeteryId'] as const)) {
  @IsEnum(EntityStatus)
  @IsOptional()
  status?: EntityStatus;
}
