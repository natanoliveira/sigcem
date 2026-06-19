import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface AuditParams {
  tenantId: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'view_sensitive';
  entityType: string;
  entityId: string;
  previousData?: object;
  newData?: object;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: AuditParams): Promise<void> {
    await this.prisma.auditLog.create({ data: params });
  }
}
