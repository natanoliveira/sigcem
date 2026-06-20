import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { Roles } from '@shared/decorators/roles.decorator';
import { RequirePermission } from '@shared/decorators/require-permission.decorator';
import { SystemModule, PermissionAction } from '@prisma/client';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Controller('audit-logs')
@Roles('ADMIN', 'MANAGER')
export class AuditLogController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermission(SystemModule.AUDIT, PermissionAction.VIEW)
  async findAll(@Query() query: QueryAuditLogDto, @CurrentUser() user: UserPayload) {
    const { entityType, entityId, userId, action, startDate, endDate, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: user.tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  @Get(':id')
  @RequirePermission(SystemModule.AUDIT, PermissionAction.VIEW)
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.prisma.auditLog.findFirst({
      where: { id, tenantId: user.tenantId },
    });
  }
}
