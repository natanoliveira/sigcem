import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { AuditService } from '@shared/audit/audit.service';
import { CryptoService } from '@shared/crypto/crypto.service';
import { CreateDeceasedDto } from './dto/create-deceased.dto';
import { UpdateDeceasedDto } from './dto/update-deceased.dto';
import { QueryDeceasedDto } from './dto/query-deceased.dto';

const SENSITIVE_ROLES = ['ADMIN', 'MANAGER'];

@Injectable()
export class DeceasedService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private crypto: CryptoService,
  ) {}

  async create(dto: CreateDeceasedDto, tenantId: string, userId: string, ip?: string) {
    const { cpf, causeOfDeath, ...rest } = dto;

    const data: any = {
      ...rest,
      birthDate: new Date(dto.birthDate),
      deathDate: new Date(dto.deathDate),
    };

    if (cpf) data.taxIdHash = this.crypto.encrypt(cpf);
    if (causeOfDeath) data.causeOfDeathEnc = this.crypto.encrypt(causeOfDeath);

    const deceased = await this.prisma.forTenant(tenantId).deceased.create({ data });

    await this.audit.log({
      tenantId,
      userId,
      action: 'create',
      entityType: 'Deceased',
      entityId: deceased.id,
      newData: { ...rest, cpf: cpf ? '[PROTEGIDO]' : undefined },
      ip,
    });

    return this.sanitize(deceased, []);
  }

  async findAll(query: QueryDeceasedDto, tenantId: string) {
    const db = this.prisma.forTenant(tenantId);
    const { search, deathDateStart, deathDateEnd, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.fullName = { contains: search, mode: 'insensitive' };
    }
    if (deathDateStart || deathDateEnd) {
      where.deathDate = {};
      if (deathDateStart) where.deathDate.gte = new Date(deathDateStart);
      if (deathDateEnd) where.deathDate.lte = new Date(deathDateEnd);
    }

    const [data, total] = await Promise.all([
      db.deceased.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
        select: {
          id: true,
          fullName: true,
          birthDate: true,
          deathDate: true,
          birthPlace: true,
          nationality: true,
          createdAt: true,
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
    if (canSeeSensitive && (deceased.taxIdHash || deceased.causeOfDeathEnc)) {
      await this.audit.log({
        tenantId,
        userId,
        action: 'view_sensitive',
        entityType: 'Deceased',
        entityId: id,
        newData: { campos: ['cpf', 'causeOfDeath'], perfil: userRoles },
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

    const { cpf, causeOfDeath, ...rest } = dto;

    const data: any = { ...rest };
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    if (dto.deathDate) data.deathDate = new Date(dto.deathDate);
    if (cpf !== undefined) data.taxIdHash = cpf ? this.crypto.encrypt(cpf) : null;
    if (causeOfDeath !== undefined) data.causeOfDeathEnc = causeOfDeath ? this.crypto.encrypt(causeOfDeath) : null;

    const updated = await db.deceased.update({ where: { id }, data });

    await this.audit.log({
      tenantId,
      userId,
      action: 'update',
      entityType: 'Deceased',
      entityId: id,
      previousData: this.sanitize(current, []),
      newData: this.sanitize(updated, []),
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
      userId,
      action: 'delete',
      entityType: 'Deceased',
      entityId: id,
      previousData: this.sanitize(current, []),
      ip,
    });
  }

  private sanitize(deceased: any, roles: string[]) {
    const canSeeSensitive = roles.some((r) => SENSITIVE_ROLES.includes(r));
    const { taxIdHash, causeOfDeathEnc, ...safe } = deceased;

    if (!canSeeSensitive) return safe;

    return {
      ...safe,
      cpf: taxIdHash ? this.crypto.decrypt(taxIdHash) : null,
      causeOfDeath: causeOfDeathEnc ? this.crypto.decrypt(causeOfDeathEnc) : null,
    };
  }
}
