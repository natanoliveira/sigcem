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
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsEnum(UserRole) role: UserRole;
}

export class UpdateUserDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @MinLength(8) @IsOptional() password?: string;
  @IsEnum(UserRole) @IsOptional() role?: UserRole;
  @IsOptional() active?: boolean;
}

export class AuthDto {
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() password: string;
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
      where: { email: dto.email, active: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const payload = {
      sub:      user.id,
      email:    user.email,
      name:     user.name,
      tenantId: user.tenantId,
      roles:    [user.role],
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
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUserDto, tenantId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`Já existe um usuário com o e-mail "${dto.email}"`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: { tenantId, name: dto.name, email: dto.email, password: passwordHash, role: dto.role },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
  }

  async remove(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);
    await this.prisma.user.update({ where: { id }, data: { active: false } });
  }
}
