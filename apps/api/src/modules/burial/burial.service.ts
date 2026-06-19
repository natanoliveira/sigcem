import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BurialType, JazigoStatus } from '@prisma/client';
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

    const [falecido, jazigo] = await Promise.all([
      db.deceased.findFirst({ where: { id: dto.falecidoId } }),
      db.jazigo.findFirst({ where: { id: dto.jazigoId } }),
    ]);

    if (!falecido) throw new NotFoundException(`Falecido ${dto.falecidoId} não encontrado`);
    if (!jazigo) throw new NotFoundException(`Jazigo ${dto.jazigoId} não encontrado`);

    if (![JazigoStatus.DISPONIVEL, JazigoStatus.RESERVADO].includes(jazigo.status as JazigoStatus)) {
      throw new ConflictException(
        `Jazigo está "${jazigo.status}" — só aceita inumação quando DISPONIVEL ou RESERVADO`,
      );
    }

    const [burial] = await this.prisma.$transaction([
      this.prisma.burial.create({
        data: {
          tenantId,
          falecidoId: dto.falecidoId,
          jazigoId: dto.jazigoId,
          tipo: BurialType.INUMACAO,
          dataEvento: new Date(dto.dataEvento),
          autorizadoPor: dto.autorizadoPor,
          funeraria: dto.funeraria,
          responsavelNome: dto.responsavelNome,
          responsavelCpf: dto.responsavelCpf,
          observacoes: dto.observacoes,
        },
      }),
      this.prisma.jazigo.update({
        where: { id: dto.jazigoId },
        data: { status: JazigoStatus.OCUPADO },
      }),
      this.prisma.jazigoHistorico.create({
        data: {
          jazigoId: dto.jazigoId,
          statusAnterior: jazigo.status,
          statusNovo: JazigoStatus.OCUPADO,
          motivo: `Inumação de ${falecido.nomeCompleto}`,
          usuarioId: userId,
        },
      }),
    ]);

    await this.audit.log({
      tenantId, usuarioId: userId, acao: 'create',
      entidadeTipo: 'Burial', entidadeId: burial.id,
      dadosNovos: { tipo: 'INUMACAO', falecidoId: dto.falecidoId, jazigoId: dto.jazigoId },
      ip,
    });

    return burial;
  }

  // T-029 — Exumação
  async exumar(dto: CreateBurialDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    const [falecido, jazigo] = await Promise.all([
      db.deceased.findFirst({ where: { id: dto.falecidoId } }),
      db.jazigo.findFirst({ where: { id: dto.jazigoId } }),
    ]);

    if (!falecido) throw new NotFoundException(`Falecido ${dto.falecidoId} não encontrado`);
    if (!jazigo) throw new NotFoundException(`Jazigo ${dto.jazigoId} não encontrado`);

    if (jazigo.status !== JazigoStatus.OCUPADO) {
      throw new ConflictException(
        `Jazigo está "${jazigo.status}" — exumação só é permitida em jazigo OCUPADO`,
      );
    }

    const [burial] = await this.prisma.$transaction([
      this.prisma.burial.create({
        data: {
          tenantId,
          falecidoId: dto.falecidoId,
          jazigoId: dto.jazigoId,
          tipo: BurialType.EXUMACAO,
          dataEvento: new Date(dto.dataEvento),
          autorizadoPor: dto.autorizadoPor,
          funeraria: dto.funeraria,
          responsavelNome: dto.responsavelNome,
          responsavelCpf: dto.responsavelCpf,
          observacoes: dto.observacoes,
        },
      }),
      this.prisma.jazigo.update({
        where: { id: dto.jazigoId },
        data: { status: JazigoStatus.DISPONIVEL },
      }),
      this.prisma.jazigoHistorico.create({
        data: {
          jazigoId: dto.jazigoId,
          statusAnterior: JazigoStatus.OCUPADO,
          statusNovo: JazigoStatus.DISPONIVEL,
          motivo: `Exumação de ${falecido.nomeCompleto}`,
          usuarioId: userId,
        },
      }),
    ]);

    await this.audit.log({
      tenantId, usuarioId: userId, acao: 'create',
      entidadeTipo: 'Burial', entidadeId: burial.id,
      dadosNovos: { tipo: 'EXUMACAO', falecidoId: dto.falecidoId, jazigoId: dto.jazigoId },
      ip,
    });

    return burial;
  }

  // T-030 — Translado (operação atômica com rollback total)
  async transladar(dto: CreateTransladoDto, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);

    if (dto.jazigoOrigemId === dto.jazigoDestinoId) {
      throw new BadRequestException('Jazigo de origem e destino devem ser diferentes');
    }

    const [falecido, jazigoOrigem, jazigoDestino] = await Promise.all([
      db.deceased.findFirst({ where: { id: dto.falecidoId } }),
      db.jazigo.findFirst({ where: { id: dto.jazigoOrigemId } }),
      db.jazigo.findFirst({ where: { id: dto.jazigoDestinoId } }),
    ]);

    if (!falecido) throw new NotFoundException(`Falecido ${dto.falecidoId} não encontrado`);
    if (!jazigoOrigem) throw new NotFoundException(`Jazigo de origem não encontrado`);
    if (!jazigoDestino) throw new NotFoundException(`Jazigo de destino não encontrado`);

    if (jazigoOrigem.status !== JazigoStatus.OCUPADO) {
      throw new ConflictException(
        `Jazigo de origem está "${jazigoOrigem.status}" — translado exige status OCUPADO na origem`,
      );
    }

    if (![JazigoStatus.DISPONIVEL, JazigoStatus.RESERVADO].includes(jazigoDestino.status as JazigoStatus)) {
      throw new ConflictException(
        `Jazigo de destino está "${jazigoDestino.status}" — translado exige DISPONIVEL ou RESERVADO no destino`,
      );
    }

    // Tudo em uma única transaction — rollback automático se qualquer etapa falhar
    const [burialExumacao, burialInumacao] = await this.prisma.$transaction([
      // Burial de exumação na origem
      this.prisma.burial.create({
        data: {
          tenantId,
          falecidoId: dto.falecidoId,
          jazigoId: dto.jazigoOrigemId,
          tipo: BurialType.EXUMACAO,
          dataEvento: new Date(dto.dataEvento),
          autorizadoPor: dto.autorizadoPor,
          funeraria: dto.funeraria,
          responsavelNome: dto.responsavelNome,
          responsavelCpf: dto.responsavelCpf,
          observacoes: `Translado para jazigo ${dto.jazigoDestinoId}. ${dto.observacoes ?? ''}`.trim(),
        },
      }),
      // Burial de inumação no destino
      this.prisma.burial.create({
        data: {
          tenantId,
          falecidoId: dto.falecidoId,
          jazigoId: dto.jazigoDestinoId,
          tipo: BurialType.INUMACAO,
          dataEvento: new Date(dto.dataEvento),
          autorizadoPor: dto.autorizadoPor,
          funeraria: dto.funeraria,
          responsavelNome: dto.responsavelNome,
          responsavelCpf: dto.responsavelCpf,
          observacoes: `Translado do jazigo ${dto.jazigoOrigemId}. ${dto.observacoes ?? ''}`.trim(),
        },
      }),
      // Status origem: OCUPADO → DISPONIVEL
      this.prisma.jazigo.update({
        where: { id: dto.jazigoOrigemId },
        data: { status: JazigoStatus.DISPONIVEL },
      }),
      // Status destino: DISPONIVEL/RESERVADO → OCUPADO
      this.prisma.jazigo.update({
        where: { id: dto.jazigoDestinoId },
        data: { status: JazigoStatus.OCUPADO },
      }),
      // Histórico origem
      this.prisma.jazigoHistorico.create({
        data: {
          jazigoId: dto.jazigoOrigemId,
          statusAnterior: JazigoStatus.OCUPADO,
          statusNovo: JazigoStatus.DISPONIVEL,
          motivo: `Translado de ${falecido.nomeCompleto} para outro jazigo`,
          usuarioId: userId,
        },
      }),
      // Histórico destino
      this.prisma.jazigoHistorico.create({
        data: {
          jazigoId: dto.jazigoDestinoId,
          statusAnterior: jazigoDestino.status,
          statusNovo: JazigoStatus.OCUPADO,
          motivo: `Translado de ${falecido.nomeCompleto} da origem`,
          usuarioId: userId,
        },
      }),
    ]);

    // T-031 — audit do translado
    await this.audit.log({
      tenantId, usuarioId: userId, acao: 'create',
      entidadeTipo: 'Burial', entidadeId: burialInumacao.id,
      dadosNovos: {
        tipo: 'TRANSLADO',
        falecidoId: dto.falecidoId,
        jazigoOrigemId: dto.jazigoOrigemId,
        jazigoDestinoId: dto.jazigoDestinoId,
        burialExumacaoId: burialExumacao.id,
        burialInumacaoId: burialInumacao.id,
      },
      ip,
    });

    return { burialExumacao, burialInumacao };
  }

  async findAll(query: QueryBurialDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { falecidoId, jazigoId, tipo, dataInicio, dataFim, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (falecidoId) where.falecidoId = falecidoId;
    if (jazigoId) where.jazigoId = jazigoId;
    if (tipo) where.tipo = tipo;
    if (dataInicio || dataFim) {
      where.dataEvento = {};
      if (dataInicio) where.dataEvento.gte = new Date(dataInicio);
      if (dataFim) where.dataEvento.lte = new Date(dataFim);
    }

    const [data, total] = await Promise.all([
      db.burial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dataEvento: 'desc' },
        include: {
          falecido: { select: { id: true, nomeCompleto: true } },
          jazigo: {
            select: {
              id: true,
              codigo: true,
              quadra: { select: { codigo: true, cemiterio: { select: { nome: true } } } },
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
        falecido: { select: { id: true, nomeCompleto: true, dataNascimento: true, dataFalecimento: true } },
        jazigo: {
          select: {
            id: true,
            codigo: true,
            tipo: true,
            status: true,
            quadra: { select: { codigo: true, cemiterio: { select: { id: true, nome: true } } } },
          },
        },
      },
    });

    if (!burial) throw new NotFoundException(`Sepultamento ${id} não encontrado`);
    return burial;
  }
}
