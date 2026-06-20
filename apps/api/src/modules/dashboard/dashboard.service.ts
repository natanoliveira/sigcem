import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      gravesByStatus,
      burialsThisMonth,
      burialsLastMonth,
      totalDeceased,
      docsThisMonth,
      docsLastMonth,
      burialsByMonth,
      recentActivity,
    ] = await Promise.all([
      this.prisma.grave.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      this.prisma.burial.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.burial.count({
        where: { tenantId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      this.prisma.deceased.count({ where: { tenantId } }),
      this.prisma.document.count({
        where: { tenantId, issuedAt: { gte: startOfMonth } },
      }),
      this.prisma.document.count({
        where: { tenantId, issuedAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      this.prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::bigint AS count
        FROM burials
        WHERE tenant_id = ${tenantId}
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month
        ORDER BY month ASC
      `,
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          userId: true,
        },
      }),
    ]);

    const graveMap = { AVAILABLE: 0, OCCUPIED: 0, RESERVED: 0, BLOCKED: 0 };
    for (const g of gravesByStatus) {
      graveMap[g.status as keyof typeof graveMap] = g._count._all;
    }
    const totalGraves = Object.values(graveMap).reduce((a, b) => a + b, 0);
    const occupancyRate =
      totalGraves > 0 ? Math.round((graveMap.OCCUPIED / totalGraves) * 100) : 0;

    const burialTrend =
      burialsLastMonth > 0
        ? Math.round(((burialsThisMonth - burialsLastMonth) / burialsLastMonth) * 100)
        : burialsThisMonth > 0
          ? 100
          : 0;

    const docTrend =
      docsLastMonth > 0
        ? Math.round(((docsThisMonth - docsLastMonth) / docsLastMonth) * 100)
        : docsThisMonth > 0
          ? 100
          : 0;

    return {
      graves: {
        total: totalGraves,
        available: graveMap.AVAILABLE,
        occupied: graveMap.OCCUPIED,
        reserved: graveMap.RESERVED,
        blocked: graveMap.BLOCKED,
        occupancyRate,
      },
      burials: {
        thisMonth: burialsThisMonth,
        lastMonth: burialsLastMonth,
        trend: burialTrend,
        byMonth: burialsByMonth.map((b) => ({
          month: b.month,
          count: Number(b.count),
        })),
      },
      deceased: {
        total: totalDeceased,
      },
      documents: {
        thisMonth: docsThisMonth,
        lastMonth: docsLastMonth,
        trend: docTrend,
      },
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }
}
