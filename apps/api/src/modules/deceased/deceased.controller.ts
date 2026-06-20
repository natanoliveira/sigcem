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
import { DeceasedService } from './deceased.service';
import { CreateDeceasedDto } from './dto/create-deceased.dto';
import { UpdateDeceasedDto } from './dto/update-deceased.dto';
import { QueryDeceasedDto } from './dto/query-deceased.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { RequirePermission } from '@shared/decorators/require-permission.decorator';
import { SystemModule, PermissionAction } from '@prisma/client';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';

@Controller('deceased')
export class DeceasedController {
  constructor(private readonly service: DeceasedService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @RequirePermission(SystemModule.DECEASED, PermissionAction.CREATE)
  create(
    @Body() dto: CreateDeceasedDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.create(dto, user.tenantId, user.sub, req.ip);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  @RequirePermission(SystemModule.DECEASED, PermissionAction.VIEW)
  findAll(@Query() query: QueryDeceasedDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(query, user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  @RequirePermission(SystemModule.DECEASED, PermissionAction.VIEW)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.findOne(id, user.tenantId, user.roles, user.sub, req.ip);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @RequirePermission(SystemModule.DECEASED, PermissionAction.EDIT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDeceasedDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.update(id, dto, user.tenantId, user.sub, req.ip);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  @RequirePermission(SystemModule.DECEASED, PermissionAction.DELETE)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.remove(id, user.tenantId, user.sub, req.ip);
  }
}
