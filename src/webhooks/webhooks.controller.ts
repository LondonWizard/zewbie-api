import { Controller, Get, Post, Put, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  findAll() {
    return { message: 'GET /webhooks - placeholder', status: 'not_implemented' };
  }

  @Post()
  create() {
    return { message: 'POST /webhooks - placeholder', status: 'not_implemented' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: `GET /webhooks/${id} - placeholder`, status: 'not_implemented' };
  }

  @Put(':id')
  update(@Param('id') id: string) {
    return { message: `PUT /webhooks/${id} - placeholder`, status: 'not_implemented' };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { message: `DELETE /webhooks/${id} - placeholder`, status: 'not_implemented' };
  }

  @Get(':id/logs')
  getLogs(@Param('id') id: string) {
    return { message: `GET /webhooks/${id}/logs - placeholder`, status: 'not_implemented' };
  }
}
