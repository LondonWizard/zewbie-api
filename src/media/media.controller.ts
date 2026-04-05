import { Controller, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UploadUrlSchema } from './dto/media.dto';
import type { UploadUrlDto } from './dto/media.dto';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  getUploadUrl(
    @Body(new ZodValidationPipe(UploadUrlSchema)) body: UploadUrlDto,
  ) {
    return this.mediaService.getUploadUrl(body.folder, body.filename, body.contentType);
  }

  @Delete(':key')
  deleteFile(@Param('key') key: string) {
    return this.mediaService.deleteFile(key);
  }
}
