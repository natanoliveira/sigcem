import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface AuditParams {
  tenantId: string;
  usuarioId: string;
  acao: 'create' | 'update' | 'delete' | 'view_sensitive';
  entidadeTipo: string;
  entidadeId: string;
  dadosAnteriores?: object;
  dadosNovos?: object;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: AuditParams): Promise<void> {
    await this.prisma.auditLog.create({ data: params });
  }
}
