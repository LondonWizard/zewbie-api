import { Controller, Get, Put, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll() {
    return { message: 'GET /notifications - placeholder', status: 'not_implemented' };
  }

  @Put(':id/read')
  markRead(@Param('id') id: string) {
    return { message: `PUT /notifications/${id}/read - placeholder`, status: 'not_implemented' };
  }

  @Put('read-all')
  markAllRead() {
    return { message: 'PUT /notifications/read-all - placeholder', status: 'not_implemented' };
  }

  @Get('settings')
  getSettings() {
    return { message: 'GET /notifications/settings - placeholder', status: 'not_implemented' };
  }

  @Put('settings')
  updateSettings() {
    return { message: 'PUT /notifications/settings - placeholder', status: 'not_implemented' };
  }
}
