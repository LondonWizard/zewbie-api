import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread-count')
  countUnread(@CurrentUser() userId: string) {
    return this.notificationsService.countUnread(userId);
  }

  @Post(':id/read')
  markRead(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ) {
    return this.notificationsService.markRead(id, userId);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() userId: string) {
    return this.notificationsService.markAllRead(userId);
  }
}
