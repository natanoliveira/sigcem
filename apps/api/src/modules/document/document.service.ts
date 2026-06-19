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
    entityType: string,
    entityId: string,
    type: DocumentType,
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
    const objectKey = `${entityType.toLowerCase()}/${entityId}/${randomUUID()}${ext}`;

    await this.storage.upload(tenantId, objectKey, file.buffer, file.mimetype);

    const document = await this.prisma.forTenant(tenantId).document.create({
      data: {
        type,
        entityType,
        entityId,
        fileName: file.originalname,
        storageKey: objectKey,
        issuedBy: userId,
      } as any,
    });

    await this.audit.log({
      tenantId, userId, action: 'create',
      entityType: 'Document', entityId: document.id,
      newData: { type, entityType, entityId, fileName: file.originalname },
      ip,
    });

    const url = await this.storage.presignedUrl(tenantId, objectKey);
    return { ...document, url };
  }

  async findAll(query: QueryDocumentDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { entityType, entityId, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { active: true };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      db.document.findMany({ where, skip, take: limit, orderBy: { issuedAt: 'desc' } }),
      db.document.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // T-035 — download com URL assinada
  async download(id: string, tenantId: string, userId: string, ip?: string) {
    const document = await this.prisma.forTenant(tenantId).document.findFirst({
      where: { id, active: true },
    });
    if (!document) throw new NotFoundException(`Documento ${id} não encontrado`);

    const url = await this.storage.presignedUrl(tenantId, document.storageKey);
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    await this.audit.log({
      tenantId, userId, action: 'view_sensitive',
      entityType: 'Document', entityId: id,
      newData: { action: 'download', fileName: document.fileName },
      ip,
    });

    return { url, expiresAt, fileName: document.fileName };
  }

  // T-036 — inativação (arquivo permanece no MinIO)
  async inativar(id: string, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);
    const document = await db.document.findFirst({ where: { id } });
    if (!document) throw new NotFoundException(`Documento ${id} não encontrado`);

    await db.document.update({ where: { id }, data: { active: false } });

    await this.audit.log({
      tenantId, userId, action: 'update',
      entityType: 'Document', entityId: id,
      previousData: { active: true },
      newData: { active: false },
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
        deceased: true,
        grave: {
          include: {
            block: { include: { cemetery: true } },
          },
        },
      },
    });

    if (!burial) throw new NotFoundException(`Sepultamento ${burialId} não encontrado`);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const numeroRegistro = `${new Date().getFullYear()}-${burial.id.slice(0, 8).toUpperCase()}`;

    const pdfBuffer = await this.certificate.generate({
      municipio: tenant?.name ?? 'Município',
      deceasedName: burial.deceased.fullName,
      deceasedBirthDate: burial.deceased.birthDate,
      deceasedDeathDate: burial.deceased.deathDate,
      birthPlace: burial.deceased.birthPlace,
      fatherName: burial.deceased.fatherName,
      motherName: burial.deceased.motherName,
      operationType: burial.type as any,
      eventDate: burial.eventDate,
      graveCode: burial.grave.code,
      blockCode: burial.grave.block.code,
      cemeteryName: burial.grave.block.cemetery.name,
      authorizedBy: burial.authorizedBy,
      funeralHome: burial.funeralHome,
      issuedByName: userName,
      numeroRegistro,
    });

    const objectKey = `certidoes/${burialId}/${randomUUID()}.pdf`;
    await this.storage.upload(tenantId, objectKey, pdfBuffer, 'application/pdf');

    const document = await this.prisma.forTenant(tenantId).document.create({
      data: {
        type: DocumentType.CERTIFICATE,
        entityType: 'Burial',
        entityId: burialId,
        fileName: `certidao-${numeroRegistro}.pdf`,
        storageKey: objectKey,
        issuedBy: userId,
      } as any,
    });

    await this.audit.log({
      tenantId, userId, action: 'create',
      entityType: 'Document', entityId: document.id,
      newData: { type: 'CERTIFICATE', burialId, numeroRegistro },
      ip,
    });

    const url = await this.storage.presignedUrl(tenantId, objectKey);
    return { ...document, url, numeroRegistro };
  }
}
