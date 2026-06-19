import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { AuditService } from '@shared/audit/audit.service';
import { CryptoService } from '@shared/crypto/crypto.service';
import { CreateDeceasedDto } from './dto/create-deceased.dto';
import { UpdateDeceasedDto } from './dto/update-deceased.dto';
import { QueryDeceasedDto } from './dto/query-deceased.dto';

const SENSITIVE_ROLES = ['ADMIN', 'GESTOR'];

@Injectable()
export class DeceasedService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private crypto: CryptoService,
  ) {}

  async create(dto: CreateDeceasedDto, tenantId: string, userId: string, ip?: string) {
    const { cpf, causaMortis, ...rest } = dto;

    const data: any = {
      ...rest,
      dataNascimento: new Date(dto.dataNascimento),
      dataFalecimento: new Date(dto.dataFalecimento),
    };

    if (cpf) data.cpfHash = this.crypto.encrypt(cpf);
    if (causaMortis) data.causaMortisEnc = this.crypto.encrypt(causaMortis);

    const deceased = await this.prisma.forTenant(tenantId).deceased.create({ data });

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'create',
      entidadeTipo: 'Deceased',
      entidadeId: deceased.id,
      dadosNovos: { ...rest, cpf: cpf ? '[PROTEGIDO]' : undefined },
      ip,
    });

    return this.sanitize(deceased, []);
  }

  async findAll(query: QueryDeceasedDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { search, dataFalecimentoInicio, dataFalecimentoFim, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.nomeCompleto = { contains: search, mode: 'insensitive' };
    }
    if (dataFalecimentoInicio || dataFalecimentoFim) {
      where.dataFalecimento = {};
      if (dataFalecimentoInicio) where.dataFalecimento.gte = new Date(dataFalecimentoInicio);
      if (dataFalecimentoFim) where.dataFalecimento.lte = new Date(dataFalecimentoFim);
    }

    const [data, total] = await Promise.all([
      db.deceased.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nomeCompleto: 'asc' },
        select: {
          id: true,
          nomeCompleto: true,
          dataNascimento: true,
          dataFalecimento: true,
          naturalidade: true,
          nacionalidade: true,
          criadoEm: true,
        },
      }),
      db.deceased.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // T-025 + T-026 — controle LGPD por perfil
  async findOne(id: string, tenantId: string, userRoles: string[], userId: string, ip?: string) {
    const deceased = await this.prisma.forTenant(tenantId).deceased.findFirst({
      where: { id },
    });

    if (!deceased) throw new NotFoundException(`Falecido ${id} não encontrado`);

    const canSeeSensitive = userRoles.some((r) => SENSITIVE_ROLES.includes(r));

    // T-026 — audit de acesso a dados sensíveis
    if (canSeeSensitive && (deceased.cpfHash || deceased.causaMortisEnc)) {
      await this.audit.log({
        tenantId,
        usuarioId: userId,
        acao: 'view_sensitive',
        entidadeTipo: 'Deceased',
        entidadeId: id,
        dadosNovos: { campos: ['cpf', 'causaMortis'], perfil: userRoles },
        ip,
      });
    }

    return this.sanitize(deceased, canSeeSensitive ? userRoles : []);
  }

  async update(
    id: string,
    dto: UpdateDeceasedDto,
    tenantId: string,
    userId: string,
    ip?: string,
  ) {
    const db = this.prisma.forTenant(tenantId);
    const current = await db.deceased.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Falecido ${id} não encontrado`);

    const { cpf, causaMortis, ...rest } = dto;

    const data: any = { ...rest };
    if (dto.dataNascimento) data.dataNascimento = new Date(dto.dataNascimento);
    if (dto.dataFalecimento) data.dataFalecimento = new Date(dto.dataFalecimento);
    if (cpf !== undefined) data.cpfHash = cpf ? this.crypto.encrypt(cpf) : null;
    if (causaMortis !== undefined) data.causaMortisEnc = causaMortis ? this.crypto.encrypt(causaMortis) : null;

    const updated = await db.deceased.update({ where: { id }, data });

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'update',
      entidadeTipo: 'Deceased',
      entidadeId: id,
      dadosAnteriores: this.sanitize(current, []),
      dadosNovos: this.sanitize(updated, []),
      ip,
    });

    return this.sanitize(updated, []);
  }

  async remove(id: string, tenantId: string, userId: string, ip?: string) {
    const db = this.prisma.forTenant(tenantId);
    const current = await db.deceased.findFirst({ where: { id } });
    if (!current) throw new NotFoundException(`Falecido ${id} não encontrado`);

    await db.deceased.delete({ where: { id } });

    await this.audit.log({
      tenantId,
      usuarioId: userId,
      acao: 'delete',
      entidadeTipo: 'Deceased',
      entidadeId: id,
      dadosAnteriores: this.sanitize(current, []),
      ip,
    });
  }

  private sanitize(deceased: any, roles: string[]) {
    const canSeeSensitive = roles.some((r) => SENSITIVE_ROLES.includes(r));
    const { cpfHash, causaMortisEnc, ...safe } = deceased;

    if (!canSeeSensitive) return safe;

    return {
      ...safe,
      cpf: cpfHash ? this.crypto.decrypt(cpfHash) : null,
      causaMortis: causaMortisEnc ? this.crypto.decrypt(causaMortisEnc) : null,
    };
  }
}
