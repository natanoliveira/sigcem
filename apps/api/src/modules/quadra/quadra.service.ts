import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { AuditService } from '@shared/audit/audit.service';
import { CreateQuadraDto } from './dto/create-quadra.dto';
import { UpdateQuadraDto } from './dto/update-quadra.dto';
import { QueryQuadraDto } from './dto/query-quadra.dto';

@Injectable()
export class QuadraService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateQuadraDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const cemetery = await db.cemetery.findFirst({ where: { id: dto.cemiterioId } });
    if (!cemetery) {
      throw new NotFoundException(`Cemitério ${dto.cemiterioId} não encontrado`);
    }

    const existing = await db.quadra.findFirst({
      where: { cemiterioId: dto.cemiterioId, codigo: dto.codigo },
    });
    if (existing) {
      throw new ConflictException(
        `Já existe uma quadra com código "${dto.codigo}" neste cemitério`,
      );
    }

    const quadra = await db.quadra.create({ data: dto as any });

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'create',
      entidadeTipo: 'Quadra',
      entidadeId: quadra.id,
      dadosNovos: quadra,
      ip,
    });

    return quadra;
  }

  async findAll(query: QueryQuadraDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { cemiterioId, status, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (cemiterioId) where.cemiterioId = cemiterioId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      db.quadra.findMany({
        where,
        skip,
        take: limit,
        orderBy: { codigo: 'asc' },
        include: {
          cemiterio: { select: { id: true, nome: true } },
          _count: { select: { jazigos: true } },
        },
      }),
      db.quadra.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const quadra = await this.prisma.forTenant(tenantId).quadra.findFirst({
      where: { id },
      include: {
        cemiterio: { select: { id: true, nome: true } },
        jazigos: {
          select: { id: true, codigo: true, tipo: true, status: true },
          orderBy: { codigo: 'asc' },
        },
      },
    });

    if (!quadra) throw new NotFoundException(`Quadra ${id} não encontrada`);
    return quadra;
  }

  async update(
    id: string,
    dto: UpdateQuadraDto,
    tenantId: string,
    userId: string,
    ip?: string,
  ) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.quadra.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Quadra ${id} não encontrada`);

    if (dto.codigo && dto.codigo !== current.codigo) {
      const conflict = await db.quadra.findFirst({
        where: { cemiterioId: current.cemiterioId, codigo: dto.codigo },
      });
      if (conflict) {
        throw new ConflictException(
          `Já existe uma quadra com código "${dto.codigo}" neste cemitério`,
        );
      }
    }

    const updated = await db.quadra.update({ where: { id }, data: dto });

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'update',
      entidadeTipo: 'Quadra',
      entidadeId: id,
      dadosAnteriores: current,
      dadosNovos: updated,
      ip,
    });

    return updated;
  }

  async remove(id: string, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.quadra.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Quadra ${id} não encontrada`);

    await db.quadra.delete({ where: { id } });

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'delete',
      entidadeTipo: 'Quadra',
      entidadeId: id,
      dadosAnteriores: current,
      ip,
    });
  }
}
