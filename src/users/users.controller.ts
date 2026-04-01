import { Controller, Get, Put, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe() {
    return { message: 'GET /users/me - placeholder', status: 'not_implemented' };
  }

  @Put('me')
  updateMe() {
    return { message: 'PUT /users/me - placeholder', status: 'not_implemented' };
  }

  @Put('me/password')
  updatePassword() {
    return { message: 'PUT /users/me/password - placeholder', status: 'not_implemented' };
  }

  @Delete('me')
  deleteMe() {
    return { message: 'DELETE /users/me - placeholder', status: 'not_implemented' };
  }

  @Get('me/notifications')
  getNotifications() {
    return { message: 'GET /users/me/notifications - placeholder', status: 'not_implemented' };
  }

  @Put('me/notifications/settings')
  updateNotificationSettings() {
    return { message: 'PUT /users/me/notifications/settings - placeholder', status: 'not_implemented' };
  }

  @Get('me/activity')
  getActivity() {
    return { message: 'GET /users/me/activity - placeholder', status: 'not_implemented' };
  }
}
