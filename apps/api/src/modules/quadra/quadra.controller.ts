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
import { QuadraService } from './quadra.service';
import { CreateQuadraDto } from './dto/create-quadra.dto';
import { UpdateQuadraDto } from './dto/update-quadra.dto';
import { QueryQuadraDto } from './dto/query-quadra.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';

@Controller('quadras')
export class QuadraController {
  constructor(private readonly service: QuadraService) {}

  @Post()
  @Roles('ADMIN', 'GESTOR')
  create(
    @Body() dto: CreateQuadraDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.create(dto, user.tenantId, user.sub, req.ip);
  }

  @Get()
  @Roles('ADMIN', 'GESTOR', 'OPERADOR', 'AGENTE_DOCUMENTAL')
  findAll(@Query() query: QueryQuadraDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(query, user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'GESTOR', 'OPERADOR', 'AGENTE_DOCUMENTAL')
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GESTOR')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuadraDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.update(id, dto, user.tenantId, user.sub, req.ip);
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
