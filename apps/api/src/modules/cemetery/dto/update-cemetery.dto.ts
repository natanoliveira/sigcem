import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { EntityStatus } from '@prisma/client';
import { CreateCemeteryDto } from './create-cemetery.dto';

export class UpdateCemeteryDto extends PartialType(CreateCemeteryDto) {
  @IsEnum(EntityStatus)
  @IsOptional()
  status?: EntityStatus;
}
