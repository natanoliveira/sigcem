import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '@shared/database/prisma.service';
import { Public } from '@shared/decorators/public.decorator';

class PublicDeceasedQueryDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  municipio?: string; // tenant.domain

  @IsDateString()
  @IsOptional()
  deathDateStart?: string;

  @IsDateString()
  @IsOptional()
  deathDateEnd?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

@Public()
@Controller('public/v1')
export class PublicController {
  constructor(private prisma: PrismaService) {}

  private async resolveTenant(municipio?: string): Promise<string | null> {
    if (!municipio) return null;
    const tenant = await this.prisma.tenant.findUnique({ where: { domain: municipio } });
    return tenant?.id ?? null;
  }

  // T-043 — busca pública de falecidos
  @Get('deceased')
  async searchDeceased(@Query() query: PublicDeceasedQueryDto) {
    const { nome, municipio, deathDateStart, deathDateEnd, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (municipio) {
      const tenantId = await this.resolveTenant(municipio);
      if (!tenantId) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
      where.tenantId = tenantId;
    }

    if (nome) where.fullName = { contains: nome, mode: 'insensitive' };

    if (deathDateStart || deathDateEnd) {
      where.deathDate = {};
      if (deathDateStart) where.deathDate.gte = new Date(deathDateStart);
      if (deathDateEnd) where.deathDate.lte = new Date(deathDateEnd);
    }

    const [data, total] = await Promise.all([
      this.prisma.deceased.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
        // Somente campos públicos — NUNCA taxIdHash, causeOfDeathEnc
        select: {
          id: true,
          fullName: true,
          birthDate: true,
          deathDate: true,
          birthPlace: true,
          burials: {
            where: { type: 'INHUMATION' },
            orderBy: { eventDate: 'desc' },
            take: 1,
            select: {
              eventDate: true,
              grave: {
                select: {
                  code: true,
                  block: {
                    select: {
                      code: true,
                      cemetery: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.deceased.count({ where }),
    ]);

    // Achatar a localização para facilitar o consumo no frontend
    const result = data.map(({ burials, ...d }) => ({
      ...d,
      localizacao: burials[0]
        ? {
            cemiterio: burials[0].grave.block.cemetery.name,
            quadra: burials[0].grave.block.code,
            jazigo: burials[0].grave.code,
            dataInumacao: burials[0].eventDate,
          }
        : null,
    }));

    return { data: result, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // T-044 — consulta pública de jazigo
  @Get('graves/:id')
  async getGrave(@Param('id') id: string) {
    const grave = await this.prisma.grave.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        block: {
          select: {
            code: true,
            cemetery: { select: { name: true } },
          },
        },
        burials: {
          where: { type: 'INHUMATION' },
          orderBy: { eventDate: 'desc' },
          take: 1,
          select: {
            eventDate: true,
            deceased: {
              select: {
                fullName: true,
                birthDate: true,
                deathDate: true,
                birthPlace: true,
                // Campos sensíveis NUNCA são retornados aqui
              },
            },
          },
        },
      },
    });

    if (!grave) throw new NotFoundException('Jazigo não encontrado');

    const { burials, ...rest } = grave;
    return {
      ...rest,
      ocupante: burials[0]
        ? {
            fullName: burials[0].deceased.fullName,
            birthDate: burials[0].deceased.birthDate,
            deathDate: burials[0].deceased.deathDate,
            birthPlace: burials[0].deceased.birthPlace,
            dataInumacao: burials[0].eventDate,
          }
        : null,
    };
  }
}
