import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { AuditService } from '@shared/audit/audit.service';
import { CreateBlockDto } from './dto/create-quadra.dto';
import { UpdateBlockDto } from './dto/update-quadra.dto';
import { QueryBlockDto } from './dto/query-quadra.dto';

@Injectable()
export class QuadraService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateBlockDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const cemetery = await db.cemetery.findFirst({ where: { id: dto.cemeteryId } });
    if (!cemetery) {
      throw new NotFoundException(`Cemitério ${dto.cemeteryId} não encontrado`);
    }

    const existing = await db.block.findFirst({
      where: { cemeteryId: dto.cemeteryId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Já existe uma quadra com código "${dto.code}" neste cemitério`,
      );
    }

    const block = await db.block.create({ data: dto as any });

    await this.audit.log({
      tenantId,
      userId,
      action: 'create',
      entityType: 'Quadra',
      entityId: block.id,
      newData: block,
      ip,
    });

    return block;
  }

  async findAll(query: QueryBlockDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { cemeteryId, status, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (cemeteryId) where.cemeteryId = cemeteryId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      db.block.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          cemetery: { select: { id: true, name: true } },
          _count: { select: { graves: true } },
        },
      }),
      db.block.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const block = await this.prisma.forTenant(tenantId).block.findFirst({
      where: { id },
      include: {
        cemetery: { select: { id: true, name: true } },
        graves: {
          select: { id: true, code: true, type: true, status: true },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!block) throw new NotFoundException(`Quadra ${id} não encontrada`);
    return block;
  }

  async update(
    id: string,
    dto: UpdateBlockDto,
    tenantId: string,
    userId: string,
    ip?: string,
  ) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.block.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Quadra ${id} não encontrada`);

    if (dto.code && dto.code !== current.code) {
      const conflict = await db.block.findFirst({
        where: { cemeteryId: current.cemeteryId, code: dto.code },
      });
      if (conflict) {
        throw new ConflictException(
          `Já existe uma quadra com código "${dto.code}" neste cemitério`,
        );
      }
    }

    const updated = await db.block.update({ where: { id }, data: dto });

    await this.audit.log({
      tenantId,
      userId,
      action: 'update',
      entityType: 'Quadra',
      entityId: id,
      previousData: current,
      newData: updated,
      ip,
    });

    return updated;
  }

  async remove(id: string, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.block.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Quadra ${id} não encontrada`);

    await db.block.delete({ where: { id } });

    await this.audit.log({
      tenantId,
      userId,
      action: 'delete',
      entityType: 'Quadra',
      entityId: id,
      previousData: current,
      ip,
    });
  }
}
