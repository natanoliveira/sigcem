import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { DocumentType } from '@prisma/client';
import { DocumentService } from './document.service';
import { QueryDocumentDto } from './dto/query-document.dto';
import { EmitCertificateDto } from './dto/emit-certificate.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';

@Controller('documents')
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  // T-034 — upload
  @Post('upload')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR', 'AGENTE_DOCUMENTAL')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('entidadeTipo') entidadeTipo: string,
    @Query('entidadeId') entidadeId: string,
    @Query('tipo') tipo: string,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    if (!entidadeTipo || !entidadeId) {
      throw new BadRequestException('entidadeTipo e entidadeId são obrigatórios');
    }
    if (!Object.values(DocumentType).includes(tipo as DocumentType)) {
      throw new BadRequestException(`Tipo inválido. Permitido: ${Object.values(DocumentType).join(', ')}`);
    }

    return this.service.upload(
      file,
      entidadeTipo,
      entidadeId,
      tipo as DocumentType,
      user.tenantId,
      user.sub,
      user.name,
      req.ip,
    );
  }

  @Get()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR', 'AGENTE_DOCUMENTAL')
  findAll(@Query() query: QueryDocumentDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(query, user.tenantId);
  }

  // T-035 — download com URL assinada
  @Get(':id/download')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR', 'AGENTE_DOCUMENTAL')
  download(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.download(id, user.tenantId, user.sub, req.ip);
  }

  // T-036 — inativação
  @Patch(':id/inativar')
  @Roles('ADMIN', 'GESTOR')
  inativar(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.inativar(id, user.tenantId, user.sub, req.ip);
  }

  // T-039 — emissão de certidão
  @Post('certidao')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR', 'AGENTE_DOCUMENTAL')
  emitirCertidao(
    @Body() dto: EmitCertificateDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.emitirCertidao(
      dto.burialId,
      user.tenantId,
      user.sub,
      user.name,
      req.ip,
    );
  }
}
