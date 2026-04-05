import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateUserSchema, UpdateNotificationSettingsSchema } from './dto/user.dto';
import { PaginationSchema } from '../common/dto/pagination.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() userId: string) {
    return this.usersService.findById(userId);
  }

  @Put('me')
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  updateMe(@CurrentUser() userId: string, @Body() body: unknown) {
    return this.usersService.update(userId, body as Record<string, unknown>);
  }

  @Delete('me')
  deleteMe(@CurrentUser() userId: string) {
    return this.usersService.softDelete(userId);
  }

  @Get('me/notifications')
  getNotifications(
    @CurrentUser() userId: string,
    @Query(new ZodValidationPipe(PaginationSchema)) query: unknown,
  ) {
    return this.usersService.getNotifications(
      userId,
      query as { page: number; limit: number; sortOrder: 'asc' | 'desc' },
    );
  }

  @Put('me/notifications/settings')
  updateNotificationSettings(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(UpdateNotificationSettingsSchema)) body: unknown,
  ) {
    return this.usersService.updateNotificationSettings(
      userId,
      body as Record<string, boolean>,
    );
  }

  @Get('me/activity')
  getActivity(
    @CurrentUser() userId: string,
    @Query(new ZodValidationPipe(PaginationSchema)) query: unknown,
  ) {
    return this.usersService.getActivity(
      userId,
      query as { page: number; limit: number; sortOrder: 'asc' | 'desc' },
    );
  }
}
