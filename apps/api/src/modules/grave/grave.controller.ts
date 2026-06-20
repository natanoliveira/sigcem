import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { GraveService } from './grave.service';
import { CreateGraveDto } from './dto/create-grave.dto';
import { UpdateGraveDto } from './dto/update-grave.dto';
import { QueryGraveDto } from './dto/query-grave.dto';
import { ChangeStatusGraveDto } from './dto/change-status-grave.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { RequirePermission } from '@shared/decorators/require-permission.decorator';
import { SystemModule, PermissionAction } from '@prisma/client';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';

@Controller('graves')
export class GraveController {
  constructor(private readonly service: GraveService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @RequirePermission(SystemModule.GRAVES, PermissionAction.CREATE)
  create(
    @Body() dto: CreateGraveDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.create(dto, user.tenantId, user.sub, req.ip);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  @RequirePermission(SystemModule.GRAVES, PermissionAction.VIEW)
  findAll(@Query() query: QueryGraveDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(query, user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  @RequirePermission(SystemModule.GRAVES, PermissionAction.VIEW)
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @RequirePermission(SystemModule.GRAVES, PermissionAction.EDIT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGraveDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.update(id, dto, user.tenantId, user.sub, req.ip);
  }

  // T-020 — transição de status via rota dedicada
  @Patch(':id/status')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @RequirePermission(SystemModule.GRAVES, PermissionAction.EDIT)
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusGraveDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.changeStatus(id, dto, user.tenantId, user.sub, req.ip);
  }

  // T-021 — histórico de status
  @Get(':id/historico')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  @RequirePermission(SystemModule.GRAVES, PermissionAction.VIEW)
  findHistorico(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findHistorico(id, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  @RequirePermission(SystemModule.GRAVES, PermissionAction.DELETE)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.remove(id, user.tenantId, user.sub, req.ip);
  }
}
