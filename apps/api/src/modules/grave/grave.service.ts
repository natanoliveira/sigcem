import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { GraveStatus } from '@prisma/client';
import { PrismaService } from '@shared/database/prisma.service';
import { AuditService } from '@shared/audit/audit.service';
import { CreateGraveDto } from './dto/create-grave.dto';
import { UpdateGraveDto } from './dto/update-grave.dto';
import { QueryGraveDto } from './dto/query-grave.dto';
import { ChangeStatusGraveDto } from './dto/change-status-grave.dto';

// Transições permitidas por status atual
const ALLOWED_TRANSITIONS: Record<GraveStatus, GraveStatus[]> = {
  AVAILABLE: [GraveStatus.OCCUPIED, GraveStatus.RESERVED, GraveStatus.BLOCKED],
  RESERVED:  [GraveStatus.OCCUPIED, GraveStatus.AVAILABLE, GraveStatus.BLOCKED],
  OCCUPIED:  [GraveStatus.AVAILABLE, GraveStatus.BLOCKED],
  BLOCKED:   [GraveStatus.AVAILABLE],
};

@Injectable()
export class GraveService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateGraveDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const block = await db.block.findFirst({ where: { id: dto.blockId } });
    if (!block) throw new NotFoundException(`Quadra ${dto.blockId} não encontrada`);

    const existing = await db.grave.findFirst({
      where: { blockId: dto.blockId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Já existe um jazigo com código "${dto.code}" nesta quadra`,
      );
    }

    const grave = await db.grave.create({ data: dto as any });

    await this.audit.log({
      tenantId,
      userId,
      action: 'create',
      entityType: 'Jazigo',
      entityId: grave.id,
      newData: grave,
      ip,
    });

    return grave;
  }

  async findAll(query: QueryGraveDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { blockId, cemeteryId, status, type, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (cemeteryId) where.block = { cemeteryId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { locationRef: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      db.grave.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ blockId: 'asc' }, { code: 'asc' }],
        include: {
          block: {
            select: {
              id: true,
              code: true,
              cemetery: { select: { id: true, name: true } },
            },
          },
        },
      }),
      db.grave.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const grave = await this.prisma.forTenant(tenantId).grave.findFirst({
      where: { id },
      include: {
        block: {
          select: {
            id: true,
            code: true,
            cemetery: { select: { id: true, name: true } },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!grave) throw new NotFoundException(`Jazigo ${id} não encontrado`);
    return grave;
  }

  async update(
    id: string,
    dto: UpdateGraveDto,
    tenantId: string,
    userId: string,
    ip?: string,
  ) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.grave.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Jazigo ${id} não encontrado`);

    if (dto.code && dto.code !== current.code) {
      const conflict = await db.grave.findFirst({
        where: { blockId: current.blockId, code: dto.code },
      });
      if (conflict) {
        throw new ConflictException(
          `Já existe um jazigo com código "${dto.code}" nesta quadra`,
        );
      }
    }

    const updated = await db.grave.update({ where: { id }, data: dto });

    await this.audit.log({
      tenantId,
      userId,
      action: 'update',
      entityType: 'Jazigo',
      entityId: id,
      previousData: current,
      newData: updated,
      ip,
    });

    return updated;
  }

  // T-020 — máquina de estados
  async changeStatus(
    id: string,
    dto: ChangeStatusGraveDto,
    tenantId: string,
    userId: string,
    ip?: string,
  ) {
    const db = this.prisma.forTenant(tenantId);

    const grave = await db.grave.findFirst({ where: { id } });
    if (!grave) throw new NotFoundException(`Jazigo ${id} não encontrado`);

    const allowed = ALLOWED_TRANSITIONS[grave.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transição de "${grave.status}" para "${dto.status}" não é permitida. ` +
        `Transições válidas: ${allowed.join(', ')}`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.grave.update({
        where: { id },
        data: { status: dto.status },
      }),
      this.prisma.graveHistory.create({
        data: {
          graveId: id,
          previousStatus: grave.status,
          newStatus: dto.status,
          reason: dto.reason,
          userId,
        },
      }),
    ]);

    await this.audit.log({
      tenantId,
      userId,
      action: 'update',
      entityType: 'Jazigo',
      entityId: id,
      previousData: { status: grave.status },
      newData: { status: dto.status, reason: dto.reason },
      ip,
    });

    return updated;
  }

  // T-021 — histórico de status
  async findHistorico(id: string, tenantId: string) {
    const grave = await this.prisma.forTenant(tenantId).grave.findFirst({
      where: { id },
    });
    if (!grave) throw new NotFoundException(`Jazigo ${id} não encontrado`);

    return this.prisma.graveHistory.findMany({
      where: { graveId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.grave.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Jazigo ${id} não encontrado`);

    if (current.status === GraveStatus.OCCUPIED) {
      throw new BadRequestException(
        'Não é possível excluir um jazigo com status OCCUPIED',
      );
    }

    await db.grave.delete({ where: { id } });

    await this.audit.log({
      tenantId,
      userId,
      action: 'delete',
      entityType: 'Jazigo',
      entityId: id,
      previousData: current,
      ip,
    });
  }
}
