import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BurialType, GraveStatus } from '@prisma/client';
import { PrismaService } from '@shared/database/prisma.service';
import { AuditService } from '@shared/audit/audit.service';
import { CreateBurialDto } from './dto/create-burial.dto';
import { CreateTransladoDto } from './dto/create-translado.dto';
import { QueryBurialDto } from './dto/query-burial.dto';

@Injectable()
export class BurialService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // T-028 — Inumação
  async inumar(dto: CreateBurialDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const [deceased, grave] = await Promise.all([
      db.deceased.findFirst({ where: { id: dto.deceasedId } }),
      db.grave.findFirst({ where: { id: dto.graveId } }),
    ]);

    if (!deceased) throw new NotFoundException(`Falecido ${dto.deceasedId} não encontrado`);
    if (!grave) throw new NotFoundException(`Jazigo ${dto.graveId} não encontrado`);

    if (!([GraveStatus.AVAILABLE, GraveStatus.RESERVED] as GraveStatus[]).includes(grave.status)) {
      throw new ConflictException(
        `Jazigo está "${grave.status}" — só aceita inumação quando AVAILABLE ou RESERVED`,
      );
    }

    const [burial] = await this.prisma.$transaction([
      this.prisma.burial.create({
        data: {
          tenantId,
          deceasedId: dto.deceasedId,
          graveId: dto.graveId,
          type: BurialType.INHUMATION,
          eventDate: new Date(dto.eventDate),
          authorizedBy: dto.authorizedBy,
          funeralHome: dto.funeralHome,
          responsibleName: dto.responsibleName,
          responsibleTaxId: dto.responsibleTaxId,
          notes: dto.notes,
        },
      }),
      this.prisma.grave.update({
        where: { id: dto.graveId },
        data: { status: GraveStatus.OCCUPIED },
      }),
      this.prisma.graveHistory.create({
        data: {
          graveId: dto.graveId,
          previousStatus: grave.status,
          newStatus: GraveStatus.OCCUPIED,
          reason: `Inumação de ${deceased.fullName}`,
          userId,
        },
      }),
    ]);

    await this.audit.log({
      tenantId, userId, action: 'create',
      entityType: 'Burial', entityId: burial.id,
      newData: { type: 'INHUMATION', deceasedId: dto.deceasedId, graveId: dto.graveId },
      ip,
    });

    return burial;
  }

  // T-029 — Exumação
  async exumar(dto: CreateBurialDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const [deceased, grave] = await Promise.all([
      db.deceased.findFirst({ where: { id: dto.deceasedId } }),
      db.grave.findFirst({ where: { id: dto.graveId } }),
    ]);

    if (!deceased) throw new NotFoundException(`Falecido ${dto.deceasedId} não encontrado`);
    if (!grave) throw new NotFoundException(`Jazigo ${dto.graveId} não encontrado`);

    if (grave.status !== GraveStatus.OCCUPIED) {
      throw new ConflictException(
        `Jazigo está "${grave.status}" — exumação só é permitida em jazigo OCCUPIED`,
      );
    }

    const [burial] = await this.prisma.$transaction([
      this.prisma.burial.create({
        data: {
          tenantId,
          deceasedId: dto.deceasedId,
          graveId: dto.graveId,
          type: BurialType.EXHUMATION,
          eventDate: new Date(dto.eventDate),
          authorizedBy: dto.authorizedBy,
          funeralHome: dto.funeralHome,
          responsibleName: dto.responsibleName,
          responsibleTaxId: dto.responsibleTaxId,
          notes: dto.notes,
        },
      }),
      this.prisma.grave.update({
        where: { id: dto.graveId },
        data: { status: GraveStatus.AVAILABLE },
      }),
      this.prisma.graveHistory.create({
        data: {
          graveId: dto.graveId,
          previousStatus: GraveStatus.OCCUPIED,
          newStatus: GraveStatus.AVAILABLE,
          reason: `Exumação de ${deceased.fullName}`,
          userId,
        },
      }),
    ]);

    await this.audit.log({
      tenantId, userId, action: 'create',
      entityType: 'Burial', entityId: burial.id,
      newData: { type: 'EXHUMATION', deceasedId: dto.deceasedId, graveId: dto.graveId },
      ip,
    });

    return burial;
  }

  // T-030 — Translado (operação atômica com rollback total)
  async transladar(dto: CreateTransladoDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    if (dto.sourceGraveId === dto.targetGraveId) {
      throw new BadRequestException('Jazigo de origem e destino devem ser diferentes');
    }

    const [deceased, sourceGrave, targetGrave] = await Promise.all([
      db.deceased.findFirst({ where: { id: dto.deceasedId } }),
      db.grave.findFirst({ where: { id: dto.sourceGraveId } }),
      db.grave.findFirst({ where: { id: dto.targetGraveId } }),
    ]);

    if (!deceased) throw new NotFoundException(`Falecido ${dto.deceasedId} não encontrado`);
    if (!sourceGrave) throw new NotFoundException(`Jazigo de origem não encontrado`);
    if (!targetGrave) throw new NotFoundException(`Jazigo de destino não encontrado`);

    if (sourceGrave.status !== GraveStatus.OCCUPIED) {
      throw new ConflictException(
        `Jazigo de origem está "${sourceGrave.status}" — translado exige status OCCUPIED na origem`,
      );
    }

    if (!([GraveStatus.AVAILABLE, GraveStatus.RESERVED] as GraveStatus[]).includes(targetGrave.status)) {
      throw new ConflictException(
        `Jazigo de destino está "${targetGrave.status}" — translado exige AVAILABLE ou RESERVED no destino`,
      );
    }

    // Tudo em uma única transaction — rollback automático se qualquer etapa falhar
    const [burialExhumation, burialInhumation] = await this.prisma.$transaction([
      // Burial de exumação na origem
      this.prisma.burial.create({
        data: {
          tenantId,
          deceasedId: dto.deceasedId,
          graveId: dto.sourceGraveId,
          type: BurialType.EXHUMATION,
          eventDate: new Date(dto.eventDate),
          authorizedBy: dto.authorizedBy,
          funeralHome: dto.funeralHome,
          responsibleName: dto.responsibleName,
          responsibleTaxId: dto.responsibleTaxId,
          notes: `Translado para jazigo ${dto.targetGraveId}. ${dto.notes ?? ''}`.trim(),
        },
      }),
      // Burial de inumação no destino
      this.prisma.burial.create({
        data: {
          tenantId,
          deceasedId: dto.deceasedId,
          graveId: dto.targetGraveId,
          type: BurialType.INHUMATION,
          eventDate: new Date(dto.eventDate),
          authorizedBy: dto.authorizedBy,
          funeralHome: dto.funeralHome,
          responsibleName: dto.responsibleName,
          responsibleTaxId: dto.responsibleTaxId,
          notes: `Translado do jazigo ${dto.sourceGraveId}. ${dto.notes ?? ''}`.trim(),
        },
      }),
      // Status origem: OCCUPIED → AVAILABLE
      this.prisma.grave.update({
        where: { id: dto.sourceGraveId },
        data: { status: GraveStatus.AVAILABLE },
      }),
      // Status destino: AVAILABLE/RESERVED → OCCUPIED
      this.prisma.grave.update({
        where: { id: dto.targetGraveId },
        data: { status: GraveStatus.OCCUPIED },
      }),
      // Histórico origem
      this.prisma.graveHistory.create({
        data: {
          graveId: dto.sourceGraveId,
          previousStatus: GraveStatus.OCCUPIED,
          newStatus: GraveStatus.AVAILABLE,
          reason: `Translado de ${deceased.fullName} para outro jazigo`,
          userId,
        },
      }),
      // Histórico destino
      this.prisma.graveHistory.create({
        data: {
          graveId: dto.targetGraveId,
          previousStatus: targetGrave.status,
          newStatus: GraveStatus.OCCUPIED,
          reason: `Translado de ${deceased.fullName} da origem`,
          userId,
        },
      }),
    ]);

    // T-031 — audit do translado
    await this.audit.log({
      tenantId, userId, action: 'create',
      entityType: 'Burial', entityId: burialInhumation.id,
      newData: {
        type: 'TRANSFER',
        deceasedId: dto.deceasedId,
        sourceGraveId: dto.sourceGraveId,
        targetGraveId: dto.targetGraveId,
        burialExhumationId: burialExhumation.id,
        burialInhumationId: burialInhumation.id,
      },
      ip,
    });

    return { burialExhumation, burialInhumation };
  }

  async findAll(query: QueryBurialDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { deceasedId, graveId, type, startDate, endDate, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (deceasedId) where.deceasedId = deceasedId;
    if (graveId) where.graveId = graveId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.eventDate = {};
      if (startDate) where.eventDate.gte = new Date(startDate);
      if (endDate) where.eventDate.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      db.burial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { eventDate: 'desc' },
        include: {
          deceased: { select: { id: true, fullName: true } },
          grave: {
            select: {
              id: true,
              code: true,
              block: { select: { code: true, cemetery: { select: { name: true } } } },
            },
          },
        },
      }),
      db.burial.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const burial = await this.prisma.forTenant(tenantId).burial.findFirst({
      where: { id },
      include: {
        deceased: { select: { id: true, fullName: true, birthDate: true, deathDate: true } },
        grave: {
          select: {
            id: true,
            code: true,
            type: true,
            status: true,
            block: { select: { code: true, cemetery: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!burial) throw new NotFoundException(`Sepultamento ${id} não encontrado`);
    return burial;
  }
}
