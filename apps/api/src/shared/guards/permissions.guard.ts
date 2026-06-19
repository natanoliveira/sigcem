import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator';
import { PrismaService } from '../database/prisma.service';
import { UserPayload } from '../types/user-payload.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<{ user: UserPayload }>();
    if (!user) return false;

    if (user.roles.includes('ADMIN')) return true;

    const memberships = await this.prisma.groupMember.findMany({
      where: { userId: user.sub },
      include: {
        group: {
          include: {
            permissions: { where: { module: required.module } },
          },
        },
      },
    });

    const allowed = memberships.some((m) =>
      m.group.active &&
      m.group.permissions.some((p) => p.actions.includes(required.action)),
    );

    if (!allowed) throw new ForbiddenException('Sem permissão para esta operação');
    return true;
  }
}
