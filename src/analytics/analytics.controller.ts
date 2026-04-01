import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales')
  getSales() {
    return { message: 'GET /analytics/sales - placeholder', status: 'not_implemented' };
  }

  @Get('traffic')
  getTraffic() {
    return { message: 'GET /analytics/traffic - placeholder', status: 'not_implemented' };
  }

  @Get('products')
  getProducts() {
    return { message: 'GET /analytics/products - placeholder', status: 'not_implemented' };
  }

  @Get('customers')
  getCustomers() {
    return { message: 'GET /analytics/customers - placeholder', status: 'not_implemented' };
  }

  @Get('overview')
  getOverview() {
    return { message: 'GET /analytics/overview - placeholder', status: 'not_implemented' };
  }
}
