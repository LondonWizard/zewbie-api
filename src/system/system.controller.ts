import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';
import { SystemService } from './system.service';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @HealthCheck()
  health() {
    return this.systemService.checkHealth();
  }

  @Get('status')
  status() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('version')
  version() {
    return {
      version: process.env.API_VERSION ?? '1.0.0',
      node: process.version,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}
