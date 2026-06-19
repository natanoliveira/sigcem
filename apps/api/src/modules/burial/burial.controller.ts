import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { BurialService } from './burial.service';
import { CreateBurialDto } from './dto/create-burial.dto';
import { CreateTransladoDto } from './dto/create-translado.dto';
import { QueryBurialDto } from './dto/query-burial.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';
import { BurialType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

@Controller('burials')
export class BurialController {
  constructor(private readonly service: BurialService) {}

  // T-028 + T-029 — inumação e exumação via mesmo endpoint com tipo no body
  @Post()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  async create(
    @Body() dto: CreateBurialDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    if (dto.tipo === BurialType.INUMACAO) {
      return this.service.inumar(dto, user.tenantId, user.sub, req.ip);
    }
    if (dto.tipo === BurialType.EXUMACAO) {
      return this.service.exumar(dto, user.tenantId, user.sub, req.ip);
    }
    throw new BadRequestException(
      'Use POST /burials/translado para registrar translados',
    );
  }

  // T-030 — translado via endpoint dedicado
  @Post('translado')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR')
  translado(
    @Body() dto: CreateTransladoDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.transladar(dto, user.tenantId, user.sub, req.ip);
  }

  @Get()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR', 'AGENTE_DOCUMENTAL')
  findAll(@Query() query: QueryBurialDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(query, user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR', 'AGENTE_DOCUMENTAL')
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findOne(id, user.tenantId);
  }
}
