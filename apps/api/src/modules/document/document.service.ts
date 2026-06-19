import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '@shared/database/prisma.service';
import { AuditService } from '@shared/audit/audit.service';
import { StorageService } from '@shared/storage/storage.service';
import { CertificateService } from './certificate.service';
import { QueryDocumentDto } from './dto/query-document.dto';

const ALLOWED_MIMETYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private storage: StorageService,
    private certificate: CertificateService,
  ) {}

  // T-034 — upload genérico
  async upload(
    file: Express.Multer.File,
    entidadeTipo: string,
    entidadeId: string,
    tipo: DocumentType,
    tenantId: string,
    userId: string,
    userName: string,
    ip?: string,
  ) {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo inválido. Permitido: PDF, JPEG, PNG`,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException(`Arquivo muito grande. Máximo: 10 MB`);
    }

    const ext = extname(file.originalname) || '.bin';
    const objectKey = `${entidadeTipo.toLowerCase()}/${entidadeId}/${randomUUID()}${ext}`;

    await this.storage.upload(tenantId, objectKey, file.buffer, file.mimetype);

    const document = await this.prisma.forTenant(tenantId).document.create({
      data: {
        tipo,
        entidadeTipo,
        entidadeId,
        nomeArquivo: file.originalname,
        urlMinio: objectKey,
        emitidoPor: userId,
      } as any,
    });

    await this.audit.log({
      tenantId, usuarioId: userId, acao: 'create',
      entidadeTipo: 'Document', entidadeId: document.id,
      dadosNovos: { tipo, entidadeTipo, entidadeId, nomeArquivo: file.originalname },
      ip,
    });

    const url = await this.storage.presignedUrl(tenantId, objectKey);
    return { ...document, url };
  }

  async findAll(query: QueryDocumentDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { entidadeTipo, entidadeId, tipo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { ativo: true };
    if (entidadeTipo) where.entidadeTipo = entidadeTipo;
    if (entidadeId) where.entidadeId = entidadeId;
    if (tipo) where.tipo = tipo;

    const [data, total] = await Promise.all([
      db.document.findMany({ where, skip, take: limit, orderBy: { emitidoEm: 'desc' } }),
      db.document.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // T-035 — download com URL assinada
  async download(id: string, tenantId: string, userId: string, ip?: string) {
    const document = await this.prisma.forTenant(tenantId).document.findFirst({
      where: { id, ativo: true },
    });
    if (!document) throw new NotFoundException(`Documento ${id} não encontrado`);

    const url = await this.storage.presignedUrl(tenantId, document.urlMinio);
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    await this.audit.log({
      tenantId, usuarioId: userId, acao: 'view_sensitive',
      entidadeTipo: 'Document', entidadeId: id,
      dadosNovos: { acao: 'download', nomeArquivo: document.nomeArquivo },
      ip,
    });

    return { url, expiresAt, nomeArquivo: document.nomeArquivo };
  }

  // T-036 — inativação (arquivo permanece no MinIO)
  async inativar(id: string, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);
    const document = await db.document.findFirst({ where: { id } });
    if (!document) throw new NotFoundException(`Documento ${id} não encontrado`);

    await db.document.update({ where: { id }, data: { ativo: false } });

    await this.audit.log({
      tenantId, usuarioId: userId, acao: 'update',
      entidadeTipo: 'Document', entidadeId: id,
      dadosAnteriores: { ativo: true },
      dadosNovos: { ativo: false },
      ip,
    });
  }

  // T-039 — emissão de certidão de sepultamento
  async emitirCertidao(
    burialId: string,
    tenantId: string,
    userId: string,
    userName: string,
    ip?: string,
  ) {
    const db = this.prisma.forTenant(tenantId);

    const burial = await db.burial.findFirst({
      where: { id: burialId },
      include: {
        falecido: true,
        jazigo: {
          include: {
            quadra: { include: { cemiterio: true } },
          },
        },
      },
    });

    if (!burial) throw new NotFoundException(`Sepultamento ${burialId} não encontrado`);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const numeroRegistro = `${new Date().getFullYear()}-${burial.id.slice(0, 8).toUpperCase()}`;

    const pdfBuffer = await this.certificate.generate({
      municipio: tenant?.nome ?? 'Município',
      falecidoNome: burial.falecido.nomeCompleto,
      falecidoNascimento: burial.falecido.dataNascimento,
      falecidoFalecimento: burial.falecido.dataFalecimento,
      naturalidade: burial.falecido.naturalidade,
      nomePai: burial.falecido.nomePai,
      nomeMae: burial.falecido.nomeMae,
      tipoOperacao: burial.tipo as any,
      dataEvento: burial.dataEvento,
      jazigoCodigo: burial.jazigo.codigo,
      quadraCodigo: burial.jazigo.quadra.codigo,
      cemiterioNome: burial.jazigo.quadra.cemiterio.nome,
      autorizadoPor: burial.autorizadoPor,
      funeraria: burial.funeraria,
      emitidoPorNome: userName,
      numeroRegistro,
    });

    const objectKey = `certidoes/${burialId}/${randomUUID()}.pdf`;
    await this.storage.upload(tenantId, objectKey, pdfBuffer, 'application/pdf');

    const document = await this.prisma.forTenant(tenantId).document.create({
      data: {
        tipo: DocumentType.CERTIDAO,
        entidadeTipo: 'Burial',
        entidadeId: burialId,
        nomeArquivo: `certidao-${numeroRegistro}.pdf`,
        urlMinio: objectKey,
        emitidoPor: userId,
      } as any,
    });

    await this.audit.log({
      tenantId, usuarioId: userId, acao: 'create',
      entidadeTipo: 'Document', entidadeId: document.id,
      dadosNovos: { tipo: 'CERTIDAO', burialId, numeroRegistro },
      ip,
    });

    const url = await this.storage.presignedUrl(tenantId, objectKey);
    return { ...document, url, numeroRegistro };
  }
}
