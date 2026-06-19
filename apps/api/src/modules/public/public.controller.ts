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
  municipio?: string; // tenant.dominio

  @IsDateString()
  @IsOptional()
  dataFalecimentoInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFalecimentoFim?: string;

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
    const tenant = await this.prisma.tenant.findUnique({ where: { dominio: municipio } });
    return tenant?.id ?? null;
  }

  // T-043 — busca pública de falecidos
  @Get('deceased')
  async searchDeceased(@Query() query: PublicDeceasedQueryDto) {
    const { nome, municipio, dataFalecimentoInicio, dataFalecimentoFim, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (municipio) {
      const tenantId = await this.resolveTenant(municipio);
      if (!tenantId) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
      where.tenantId = tenantId;
    }

    if (nome) where.nomeCompleto = { contains: nome, mode: 'insensitive' };

    if (dataFalecimentoInicio || dataFalecimentoFim) {
      where.dataFalecimento = {};
      if (dataFalecimentoInicio) where.dataFalecimento.gte = new Date(dataFalecimentoInicio);
      if (dataFalecimentoFim) where.dataFalecimento.lte = new Date(dataFalecimentoFim);
    }

    const [data, total] = await Promise.all([
      this.prisma.deceased.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nomeCompleto: 'asc' },
        // Somente campos públicos — NUNCA cpfHash, causaMortisEnc
        select: {
          id: true,
          nomeCompleto: true,
          dataNascimento: true,
          dataFalecimento: true,
          naturalidade: true,
          burials: {
            where: { tipo: 'INUMACAO' },
            orderBy: { dataEvento: 'desc' },
            take: 1,
            select: {
              dataEvento: true,
              jazigo: {
                select: {
                  codigo: true,
                  quadra: {
                    select: {
                      codigo: true,
                      cemiterio: { select: { nome: true } },
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
            cemiterio: burials[0].jazigo.quadra.cemiterio.nome,
            quadra: burials[0].jazigo.quadra.codigo,
            jazigo: burials[0].jazigo.codigo,
            dataInumacao: burials[0].dataEvento,
          }
        : null,
    }));

    return { data: result, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // T-044 — consulta pública de jazigo
  @Get('jazigos/:id')
  async getJazigo(@Param('id') id: string) {
    const jazigo = await this.prisma.jazigo.findUnique({
      where: { id },
      select: {
        id: true,
        codigo: true,
        tipo: true,
        status: true,
        quadra: {
          select: {
            codigo: true,
            cemiterio: { select: { nome: true } },
          },
        },
        burials: {
          where: { tipo: 'INUMACAO' },
          orderBy: { dataEvento: 'desc' },
          take: 1,
          select: {
            dataEvento: true,
            falecido: {
              select: {
                nomeCompleto: true,
                dataNascimento: true,
                dataFalecimento: true,
                naturalidade: true,
                // Campos sensíveis NUNCA são retornados aqui
              },
            },
          },
        },
      },
    });

    if (!jazigo) throw new NotFoundException('Jazigo não encontrado');

    const { burials, ...rest } = jazigo;
    return {
      ...rest,
      ocupante: burials[0]
        ? {
            nomeCompleto: burials[0].falecido.nomeCompleto,
            dataNascimento: burials[0].falecido.dataNascimento,
            dataFalecimento: burials[0].falecido.dataFalecimento,
            naturalidade: burials[0].falecido.naturalidade,
            dataInumacao: burials[0].dataEvento,
          }
        : null,
    };
  }
}
