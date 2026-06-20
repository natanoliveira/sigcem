import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { BurialService } from './burial.service';
import { CreateBurialDto } from './dto/create-burial.dto';
import { CreateTransladoDto } from './dto/create-translado.dto';
import { QueryBurialDto } from './dto/query-burial.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { RequirePermission } from '@shared/decorators/require-permission.decorator';
import { SystemModule, PermissionAction } from '@prisma/client';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';
import { BadRequestException } from '@nestjs/common';

@Controller('burials')
export class BurialController {
  constructor(private readonly service: BurialService) {}

  // T-028 + T-029 — inumação e exumação via endpoints dedicados
  @Post('inumar')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @RequirePermission(SystemModule.BURIALS, PermissionAction.CREATE)
  async inumar(
    @Body() dto: CreateBurialDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.inumar(dto, user.tenantId, user.sub, req.ip);
  }

  @Post('exumar')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @RequirePermission(SystemModule.BURIALS, PermissionAction.CREATE)
  async exumar(
    @Body() dto: CreateBurialDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.exumar(dto, user.tenantId, user.sub, req.ip);
  }

  // T-030 — translado via endpoint dedicado
  @Post('translado')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @RequirePermission(SystemModule.BURIALS, PermissionAction.CREATE)
  translado(
    @Body() dto: CreateTransladoDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.transladar(dto, user.tenantId, user.sub, req.ip);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  @RequirePermission(SystemModule.BURIALS, PermissionAction.VIEW)
  findAll(@Query() query: QueryBurialDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(query, user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  @RequirePermission(SystemModule.BURIALS, PermissionAction.VIEW)
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findOne(id, user.tenantId);
  }
}
