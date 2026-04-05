import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /** Sends an in-app notification to a user. */
  async send(userId: string, title: string, body: string, channel: 'EMAIL' | 'PUSH' | 'IN_APP' = 'IN_APP') {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title,
        body,
        channel,
        read: false,
      },
    });

    if (channel === 'EMAIL') {
      this.logger.log(`Email notification queued for user ${userId}: ${title}`);
    }

    return notification;
  }

  /**
   * Marks a notification as read.
   * Verifies the notification belongs to the requesting user.
   */
  async markRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) {
      throw new ForbiddenException('Not authorized to modify this notification');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /** Marks all unread notifications as read for a user. */
  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }

  /** Counts unread notifications for a user. */
  async countUnread(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { unread: count };
  }
}
