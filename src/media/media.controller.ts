import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  upload() {
    return { message: 'POST /media/upload - placeholder', status: 'not_implemented' };
  }

  @Post('upload/bulk')
  bulkUpload() {
    return { message: 'POST /media/upload/bulk - placeholder', status: 'not_implemented' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: `GET /media/${id} - placeholder`, status: 'not_implemented' };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { message: `DELETE /media/${id} - placeholder`, status: 'not_implemented' };
  }

  @Get('my-files')
  getMyFiles() {
    return { message: 'GET /media/my-files - placeholder', status: 'not_implemented' };
  }
}
