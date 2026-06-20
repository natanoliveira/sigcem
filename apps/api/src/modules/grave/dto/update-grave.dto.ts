import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGraveDto } from './create-grave.dto';

export class UpdateGraveDto extends PartialType(OmitType(CreateGraveDto, ['blockId'] as const)) {}
