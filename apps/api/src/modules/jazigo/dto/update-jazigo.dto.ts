import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGraveDto } from './create-jazigo.dto';

export class UpdateGraveDto extends PartialType(OmitType(CreateGraveDto, ['blockId'] as const)) {}
