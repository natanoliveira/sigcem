import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { UserPayload } from '@shared/types/user-payload.type';

@Controller('groups')
@Roles('ADMIN')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  // ── Grupos ────────────────────────────────────────────────────────────────

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: UserPayload) {
    return this.service.create(dto, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.remove(id, user.tenantId);
  }

  // ── Membros ───────────────────────────────────────────────────────────────

  @Get(':id/members')
  listMembers(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.listMembers(id, user.tenantId);
  }

  @Post(':id/members')
  addMember(
    @Param('id') groupId: string,
    @Body('userId') userId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.addMember(groupId, userId, user.tenantId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.removeMember(groupId, userId, user.tenantId);
  }

  // ── Permissões ────────────────────────────────────────────────────────────

  @Get(':id/permissions')
  listPermissions(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.listPermissions(id, user.tenantId);
  }

  @Put(':id/permissions')
  setPermissions(
    @Param('id') groupId: string,
    @Body() dto: SetPermissionsDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.setPermissions(groupId, dto, user.tenantId);
  }
}
