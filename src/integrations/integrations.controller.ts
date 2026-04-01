import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  findAll() {
    return { message: 'GET /integrations - placeholder', status: 'not_implemented' };
  }

  @Post(':provider/connect')
  connect(@Param('provider') provider: string) {
    return { message: `POST /integrations/${provider}/connect - placeholder`, status: 'not_implemented' };
  }

  @Get(':provider/callback')
  callback(@Param('provider') provider: string) {
    return { message: `GET /integrations/${provider}/callback - placeholder`, status: 'not_implemented' };
  }

  @Delete(':provider/disconnect')
  disconnect(@Param('provider') provider: string) {
    return { message: `DELETE /integrations/${provider}/disconnect - placeholder`, status: 'not_implemented' };
  }

  @Get(':provider/status')
  getStatus(@Param('provider') provider: string) {
    return { message: `GET /integrations/${provider}/status - placeholder`, status: 'not_implemented' };
  }

  @Post('social/post')
  socialPost() {
    return { message: 'POST /integrations/social/post - placeholder', status: 'not_implemented' };
  }

  @Get('social/analytics')
  socialAnalytics() {
    return { message: 'GET /integrations/social/analytics - placeholder', status: 'not_implemented' };
  }
}
