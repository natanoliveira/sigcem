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
import { JazigoService } from './jazigo.service';
import { CreateGraveDto } from './dto/create-jazigo.dto';
import { UpdateGraveDto } from './dto/update-jazigo.dto';
import { QueryGraveDto } from './dto/query-jazigo.dto';
import { ChangeStatusGraveDto } from './dto/change-status-jazigo.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';

@Controller('jazigos')
export class JazigoController {
  constructor(private readonly service: JazigoService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(
    @Body() dto: CreateGraveDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.create(dto, user.tenantId, user.sub, req.ip);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  findAll(@Query() query: QueryGraveDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(query, user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
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
  findHistorico(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findHistorico(id, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.remove(id, user.tenantId, user.sub, req.ip);
  }
}
