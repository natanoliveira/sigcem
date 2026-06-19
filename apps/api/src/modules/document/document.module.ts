import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { CertificateService } from './certificate.service';

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, CertificateService],
  exports: [DocumentService],
})
export class DocumentModule {}
