import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@shared/database/prisma.service';

export class CreateUserDto {
  @IsString() @IsNotEmpty() nome: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) senha: string;
  @IsEnum(UserRole) perfil: UserRole;
}

export class UpdateUserDto {
  @IsString() @IsOptional() nome?: string;
  @IsString() @MinLength(8) @IsOptional() senha?: string;
  @IsEnum(UserRole) @IsOptional() perfil?: UserRole;
  @IsOptional() ativo?: boolean;
}

export class AuthDto {
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() senha: string;
}

@Injectable()
export class IamService {
  private readonly jwtSecret: string;

  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.jwtSecret = config.getOrThrow<string>('JWT_SECRET');
  }

  async auth(dto: AuthDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, ativo: true },
    });

    if (!user || !(await bcrypt.compare(dto.senha, user.senha))) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const payload = {
      sub:      user.id,
      email:    user.email,
      name:     user.nome,
      tenantId: user.tenantId,
      roles:    [user.perfil],
    };

    const accessToken = sign(payload, this.jwtSecret, {
      expiresIn: '8h',
      algorithm: 'HS256',
    });

    return { accessToken, user: payload };
  }

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true },
      orderBy: { nome: 'asc' },
    });
  }

  async create(dto: CreateUserDto, tenantId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`Já existe um usuário com o e-mail "${dto.email}"`);
    }

    const senhaHash = await bcrypt.hash(dto.senha, 12);

    return this.prisma.user.create({
      data: { tenantId, nome: dto.nome, email: dto.email, senha: senhaHash, perfil: dto.perfil },
      select: { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true },
    });
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);

    const data: any = { ...dto };
    if (dto.senha) {
      data.senha = await bcrypt.hash(dto.senha, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, nome: true, email: true, perfil: true, ativo: true },
    });
  }

  async remove(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);
    await this.prisma.user.update({ where: { id }, data: { ativo: false } });
  }
}
