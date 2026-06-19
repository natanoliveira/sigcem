import { IsString, IsNotEmpty } from 'class-validator';

export class EmitCertificateDto {
  @IsString()
  @IsNotEmpty()
  burialId: string;
}
