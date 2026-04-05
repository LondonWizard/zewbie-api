import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser, CurrentUserRole } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { DateRangeSchema } from './dto/analytics.dto';
import type { DateRangeDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('store/:storeId')
  getStoreAnalytics(
    @Param('storeId') storeId: string,
    @CurrentUser() userId: string,
    @CurrentUserRole() userRole: string,
    @Query(new ZodValidationPipe(DateRangeSchema)) query: DateRangeDto,
  ) {
    return this.analyticsService.getStoreAnalytics(
      storeId,
      new Date(query.startDate),
      new Date(query.endDate),
      userId,
      userRole,
    );
  }

  @Get('platform/summary')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getPlatformSummary() {
    return this.analyticsService.getPlatformSummary();
  }
}
