import { PartialType } from '@nestjs/mapped-types';
import { CreateDeceasedDto } from './create-deceased.dto';

export class UpdateDeceasedDto extends PartialType(CreateDeceasedDto) {}
