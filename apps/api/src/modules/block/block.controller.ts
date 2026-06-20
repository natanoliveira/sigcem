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
import { BlockService } from './block.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { QueryBlockDto } from './dto/query-block.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { RequirePermission } from '@shared/decorators/require-permission.decorator';
import { SystemModule, PermissionAction } from '@prisma/client';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';

@Controller('blocks')
export class BlockController {
  constructor(private readonly service: BlockService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @RequirePermission(SystemModule.BLOCKS, PermissionAction.CREATE)
  create(
    @Body() dto: CreateBlockDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.create(dto, user.tenantId, user.sub, req.ip);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  @RequirePermission(SystemModule.BLOCKS, PermissionAction.VIEW)
  findAll(@Query() query: QueryBlockDto, @CurrentUser() user: UserPayload) {
    return this.service.findAll(query, user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'DOCUMENT_AGENT')
  @RequirePermission(SystemModule.BLOCKS, PermissionAction.VIEW)
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @RequirePermission(SystemModule.BLOCKS, PermissionAction.EDIT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBlockDto,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.update(id, dto, user.tenantId, user.sub, req.ip);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  @RequirePermission(SystemModule.BLOCKS, PermissionAction.DELETE)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    return this.service.remove(id, user.tenantId, user.sub, req.ip);
  }
}
