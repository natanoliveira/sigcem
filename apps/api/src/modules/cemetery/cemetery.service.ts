import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { AuditService } from '@shared/audit/audit.service';
import { CreateCemeteryDto } from './dto/create-cemetery.dto';
import { UpdateCemeteryDto } from './dto/update-cemetery.dto';
import { QueryCemeteryDto } from './dto/query-cemetery.dto';

@Injectable()
export class CemeteryService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateCemeteryDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const existing = await db.cemetery.findFirst({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Cemitério com nome "${dto.name}" já existe`);
    }

    const cemetery = await db.cemetery.create({ data: dto as any });

    await this.audit.log({
      tenantId,
      userId,
      action: 'create',
      entityType: 'Cemetery',
      entityId: cemetery.id,
      newData: cemetery,
      ip,
    });

    return cemetery;
  }

  async findAll(query: QueryCemeteryDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { search, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { neighborhood: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      db.cemetery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      db.cemetery.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const cemetery = await this.prisma.forTenant(tenantId).cemetery.findFirst({
      where: { id },
      include: {
        blocks: { select: { id: true, code: true, status: true } },
      },
    });

    if (!cemetery) {
      throw new NotFoundException(`Cemitério ${id} não encontrado`);
    }

    return cemetery;
  }

  async update(
    id: string,
    dto: UpdateCemeteryDto,
    tenantId: string,
    userId: string,
    ip?: string,
  ) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.cemetery.findFirst({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Cemitério ${id} não encontrado`);
    }

    if (dto.name && dto.name !== current.name) {
      const conflict = await db.cemetery.findFirst({ where: { name: dto.name } });
      if (conflict) {
        throw new ConflictException(`Cemitério com nome "${dto.name}" já existe`);
      }
    }

    const updated = await db.cemetery.update({ where: { id }, data: dto });

    await this.audit.log({
      tenantId,
      userId,
      action: 'update',
      entityType: 'Cemetery',
      entityId: id,
      previousData: current,
      newData: updated,
      ip,
    });

    return updated;
  }

  async remove(id: string, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.cemetery.findFirst({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Cemitério ${id} não encontrado`);
    }

    await db.cemetery.delete({ where: { id } });

    await this.audit.log({
      tenantId,
      userId,
      action: 'delete',
      entityType: 'Cemetery',
      entityId: id,
      previousData: current,
      ip,
    });
  }
}
