import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JazigoStatus } from '@prisma/client';
import { PrismaService } from '@shared/database/prisma.service';
import { AuditService } from '@shared/audit/audit.service';
import { CreateJazigoDto } from './dto/create-jazigo.dto';
import { UpdateJazigoDto } from './dto/update-jazigo.dto';
import { QueryJazigoDto } from './dto/query-jazigo.dto';
import { ChangeStatusJazigoDto } from './dto/change-status-jazigo.dto';

// Transições permitidas por status atual
const ALLOWED_TRANSITIONS: Record<JazigoStatus, JazigoStatus[]> = {
  DISPONIVEL: [JazigoStatus.OCUPADO, JazigoStatus.RESERVADO, JazigoStatus.INTERDITADO],
  RESERVADO:  [JazigoStatus.OCUPADO, JazigoStatus.DISPONIVEL, JazigoStatus.INTERDITADO],
  OCUPADO:    [JazigoStatus.DISPONIVEL, JazigoStatus.INTERDITADO],
  INTERDITADO:[JazigoStatus.DISPONIVEL],
};

@Injectable()
export class JazigoService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateJazigoDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const quadra = await db.quadra.findFirst({ where: { id: dto.quadraId } });
    if (!quadra) throw new NotFoundException(`Quadra ${dto.quadraId} não encontrada`);

    const existing = await db.jazigo.findFirst({
      where: { quadraId: dto.quadraId, codigo: dto.codigo },
    });
    if (existing) {
      throw new ConflictException(
        `Já existe um jazigo com código "${dto.codigo}" nesta quadra`,
      );
    }

    const jazigo = await db.jazigo.create({ data: dto });

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'create',
      entidadeTipo: 'Jazigo',
      entidadeId: jazigo.id,
      dadosNovos: jazigo,
      ip,
    });

    return jazigo;
  }

  async findAll(query: QueryJazigoDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { quadraId, cemiterioId, status, tipo, search, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (quadraId) where.quadraId = quadraId;
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;
    if (cemiterioId) where.quadra = { cemiterioId };
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { localizacaoRef: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      db.jazigo.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ quadraId: 'asc' }, { codigo: 'asc' }],
        include: {
          quadra: {
            select: {
              id: true,
              codigo: true,
              cemiterio: { select: { id: true, nome: true } },
            },
          },
        },
      }),
      db.jazigo.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const jazigo = await this.prisma.forTenant(tenantId).jazigo.findFirst({
      where: { id },
      include: {
        quadra: {
          select: {
            id: true,
            codigo: true,
            cemiterio: { select: { id: true, nome: true } },
          },
        },
        historico: {
          orderBy: { criadoEm: 'desc' },
          take: 10,
        },
      },
    });

    if (!jazigo) throw new NotFoundException(`Jazigo ${id} não encontrado`);
    return jazigo;
  }

  async update(
    id: string,
    dto: UpdateJazigoDto,
    tenantId: string,
    userId: string,
    ip?: string,
  ) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.jazigo.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Jazigo ${id} não encontrado`);

    if (dto.codigo && dto.codigo !== current.codigo) {
      const conflict = await db.jazigo.findFirst({
        where: { quadraId: current.quadraId, codigo: dto.codigo },
      });
      if (conflict) {
        throw new ConflictException(
          `Já existe um jazigo com código "${dto.codigo}" nesta quadra`,
        );
      }
    }

    const updated = await db.jazigo.update({ where: { id }, data: dto });

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'update',
      entidadeTipo: 'Jazigo',
      entidadeId: id,
      dadosAnteriores: current,
      dadosNovos: updated,
      ip,
    });

    return updated;
  }

  // T-020 — máquina de estados
  async changeStatus(
    id: string,
    dto: ChangeStatusJazigoDto,
    tenantId: string,
    userId: string,
    ip?: string,
  ) {
    const db = this.prisma.forTenant(tenantId);

    const jazigo = await db.jazigo.findFirst({ where: { id } });
    if (!jazigo) throw new NotFoundException(`Jazigo ${id} não encontrado`);

    const allowed = ALLOWED_TRANSITIONS[jazigo.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transição de "${jazigo.status}" para "${dto.status}" não é permitida. ` +
        `Transições válidas: ${allowed.join(', ')}`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.jazigo.update({
        where: { id },
        data: { status: dto.status },
      }),
      this.prisma.jazigoHistorico.create({
        data: {
          jazigoId: id,
          statusAnterior: jazigo.status,
          statusNovo: dto.status,
          motivo: dto.motivo,
          usuarioId: userId,
        },
      }),
    ]);

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'update',
      entidadeTipo: 'Jazigo',
      entidadeId: id,
      dadosAnteriores: { status: jazigo.status },
      dadosNovos: { status: dto.status, motivo: dto.motivo },
      ip,
    });

    return updated;
  }

  // T-021 — histórico de status
  async findHistorico(id: string, tenantId: string) {
    const jazigo = await this.prisma.forTenant(tenantId).jazigo.findFirst({
      where: { id },
    });
    if (!jazigo) throw new NotFoundException(`Jazigo ${id} não encontrado`);

    return this.prisma.jazigoHistorico.findMany({
      where: { jazigoId: id },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async remove(id: string, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const current = await db.jazigo.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Jazigo ${id} não encontrado`);

    if (current.status === JazigoStatus.OCUPADO) {
      throw new BadRequestException(
        'Não é possível excluir um jazigo com status OCUPADO',
      );
    }

    await db.jazigo.delete({ where: { id } });

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'delete',
      entidadeTipo: 'Jazigo',
      entidadeId: id,
      dadosAnteriores: current,
      ip,
    });
  }
}
