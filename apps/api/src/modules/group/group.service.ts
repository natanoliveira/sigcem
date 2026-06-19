import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@shared/database/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';

@Injectable()
export class GroupService {
  constructor(private prisma: PrismaService) {}

  // ── C-02 — CRUD de grupos ─────────────────────────────────────────────────

  async findAll(tenantId: string) {
    return this.prisma.group.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { members: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id, tenantId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        permissions: true,
      },
    });
    if (!group) throw new NotFoundException(`Grupo ${id} não encontrado`);
    return group;
  }

  async create(dto: CreateGroupDto, tenantId: string) {
    const existing = await this.prisma.group.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing) throw new ConflictException(`Grupo "${dto.name}" já existe`);

    return this.prisma.group.create({
      data: { tenantId, name: dto.name, description: dto.description },
    });
  }

  async update(id: string, dto: UpdateGroupDto, tenantId: string) {
    const group = await this.prisma.group.findFirst({ where: { id, tenantId } });
    if (!group) throw new NotFoundException(`Grupo ${id} não encontrado`);

    if (dto.name && dto.name !== group.name) {
      const conflict = await this.prisma.group.findFirst({ where: { tenantId, name: dto.name } });
      if (conflict) throw new ConflictException(`Grupo "${dto.name}" já existe`);
    }

    return this.prisma.group.update({ where: { id }, data: dto });
  }

  async remove(id: string, tenantId: string) {
    const group = await this.prisma.group.findFirst({ where: { id, tenantId } });
    if (!group) throw new NotFoundException(`Grupo ${id} não encontrado`);
    await this.prisma.group.delete({ where: { id } });
  }

  // ── C-03 — Membros ────────────────────────────────────────────────────────

  async listMembers(groupId: string, tenantId: string) {
    await this.assertGroup(groupId, tenantId);
    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  async addMember(groupId: string, userId: string, tenantId: string) {
    await this.assertGroup(groupId, tenantId);

    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException(`Usuário ${userId} não encontrado`);

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new ConflictException('Usuário já é membro deste grupo');

    return this.prisma.groupMember.create({ data: { groupId, userId } });
  }

  async removeMember(groupId: string, userId: string, tenantId: string) {
    await this.assertGroup(groupId, tenantId);
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new NotFoundException('Membro não encontrado neste grupo');
    await this.prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
  }

  // ── C-04 — Permissões ─────────────────────────────────────────────────────

  async listPermissions(groupId: string, tenantId: string) {
    await this.assertGroup(groupId, tenantId);
    return this.prisma.groupPermission.findMany({ where: { groupId } });
  }

  async setPermissions(groupId: string, dto: SetPermissionsDto, tenantId: string) {
    await this.assertGroup(groupId, tenantId);

    const modules = dto.permissions.map((p) => p.module);
    const unique = new Set(modules);
    if (unique.size !== modules.length) {
      throw new BadRequestException('Módulos duplicados na lista de permissões');
    }

    await this.prisma.$transaction([
      this.prisma.groupPermission.deleteMany({ where: { groupId } }),
      ...dto.permissions.map((p) =>
        this.prisma.groupPermission.create({
          data: { groupId, module: p.module, actions: p.actions },
        }),
      ),
    ]);

    return this.prisma.groupPermission.findMany({ where: { groupId } });
  }

  private async assertGroup(groupId: string, tenantId: string) {
    const group = await this.prisma.group.findFirst({ where: { id: groupId, tenantId } });
    if (!group) throw new NotFoundException(`Grupo ${groupId} não encontrado`);
    return group;
  }
}
