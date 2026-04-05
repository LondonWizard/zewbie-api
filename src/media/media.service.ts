import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Handles file uploads to AWS S3. Generates presigned URLs so
 * clients upload directly to S3 without streaming through the API.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly bucket: string;
  private readonly region: string;

  constructor(private config: ConfigService) {
    this.bucket = this.config.get<string>('aws.s3Bucket') ?? 'zewbie-media-dev';
    this.region = this.config.get<string>('aws.region') ?? 'us-west-1';
  }

  /** Generates a presigned upload URL for the given file type and path. */
  async getUploadUrl(
    folder: string,
    filename: string,
    contentType: string,
  ) {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm',
    ];
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(`Unsupported content type: ${contentType}`);
    }

    const key = `${folder}/${Date.now()}-${filename}`;

    // TODO: Use AWS SDK v3 to generate presigned URL
    // For now return mock presigned URL
    const presignedUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}?mock-presigned=true`;
    const publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    this.logger.log(`Upload URL generated: ${key}`);
    return { uploadUrl: presignedUrl, publicUrl, key };
  }

  /** Deletes a file from S3 by key. */
  async deleteFile(key: string) {
    // TODO: Use AWS SDK v3 to delete object
    this.logger.log(`File deleted (mock): ${key}`);
    return { message: 'File deleted', key };
  }
}
