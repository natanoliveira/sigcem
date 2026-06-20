import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@shared/database/prisma.module';
import { AuditModule } from '@shared/audit/audit.module';
import { CryptoModule } from '@shared/crypto/crypto.module';
import { StorageModule } from '@shared/storage/storage.module';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { HealthModule } from './modules/health/health.module';
import { IamModule } from './modules/iam/iam.module';
import { CemeteryModule } from './modules/cemetery/cemetery.module';
import { QuadraModule } from './modules/quadra/quadra.module';
import { JazigoModule } from './modules/jazigo/jazigo.module';
import { DeceasedModule } from './modules/deceased/deceased.module';
import { BurialModule } from './modules/burial/burial.module';
import { DocumentModule } from './modules/document/document.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { PublicModule } from './modules/public/public.module';
import { GroupModule } from './modules/group/group.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    CryptoModule,
    StorageModule,
    IamModule,
    HealthModule,
    CemeteryModule,
    QuadraModule,
    JazigoModule,
    DeceasedModule,
    BurialModule,
    DocumentModule,
    AuditLogModule,
    PublicModule,
    GroupModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
