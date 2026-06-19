import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateJazigoDto } from './create-jazigo.dto';

export class UpdateJazigoDto extends PartialType(OmitType(CreateJazigoDto, ['quadraId'] as const)) {}
