import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ConnectIntegrationSchema } from './dto/integrations.dto';
import type { ConnectIntegrationDto } from './dto/integrations.dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  list(@CurrentUser() userId: string) {
    return this.integrationsService.listForUser(userId);
  }

  @Post('connect')
  connect(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(ConnectIntegrationSchema)) body: ConnectIntegrationDto,
  ) {
    return this.integrationsService.connect(
      userId,
      body.storeId,
      body.platform,
      body.accessToken,
    );
  }

  @Delete(':id')
  disconnect(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ) {
    return this.integrationsService.disconnect(id, userId);
  }
}
