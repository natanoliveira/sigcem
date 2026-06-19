import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { IamService, AuthDto, CreateUserDto, UpdateUserDto } from './iam.service';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { Public } from '@shared/decorators/public.decorator';
import { UserPayload } from '@shared/types/user-payload.type';

@Controller('iam')
export class IamController {
  constructor(private readonly service: IamService) {}

  @Post('auth')
  @Public()
  auth(@Body() dto: AuthDto) {
    return this.service.auth(dto);
  }

  @Get('me')
  me(@CurrentUser() user: UserPayload) {
    return {
      id:       user.sub,
      email:    user.email,
      name:     user.name,
      tenantId: user.tenantId,
      roles:    user.roles,
    };
  }

  @Get('users')
  @Roles('ADMIN')
  findAll(@CurrentUser() user: UserPayload) {
    return this.service.findAll(user.tenantId);
  }

  @Post('users')
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: UserPayload) {
    return this.service.create(dto, user.tenantId);
  }

  @Patch('users/:id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Delete('users/:id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.service.remove(id, user.tenantId);
  }
}
