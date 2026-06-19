import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Controller('audit-logs')
@Roles('ADMIN', 'GESTOR')
export class AuditLogController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query() query: QueryAuditLogDto, @CurrentUser() user: UserPayload) {
    const { entidadeTipo, entidadeId, usuarioId, acao, dataInicio, dataFim, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: user.tenantId };
    if (entidadeTipo) where.entidadeTipo = entidadeTipo;
    if (entidadeId) where.entidadeId = entidadeId;
    if (usuarioId) where.usuarioId = usuarioId;
    if (acao) where.acao = acao;
    if (dataInicio || dataFim) {
      where.criadoEm = {};
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio);
      if (dataFim) where.criadoEm.lte = new Date(dataFim);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.prisma.auditLog.findFirst({
      where: { id, tenantId: user.tenantId },
    });
  }
}
