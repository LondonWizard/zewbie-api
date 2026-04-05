import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';
import { TrackingService } from './tracking.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PaginationSchema } from '../common/dto/pagination.dto';
import type { PaginationDto } from '../common/dto/pagination.dto';
import {
  TrackEventSchema,
  TrackBatchSchema,
  StartSessionSchema,
} from './dto/tracking.dto';
import type { TrackEventDto, TrackBatchDto, StartSessionDto } from './dto/tracking.dto';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * Public event collector endpoint. Accepts events from frontends
   * with or without authentication. Creates anonymous data records
   * for unauthenticated visitors.
   */
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('events')
  async trackEvent(
    @Req() req: express.Request,
    @Body(new ZodValidationPipe(TrackEventSchema)) dto: TrackEventDto,
  ) {
    const ip = this.extractIp(req);
    const userId = (req as express.Request & { userId?: string }).userId;
    const dataRecord = await this.trackingService.ensureDataRecord(userId);

    await this.trackingService.trackIp(dataRecord.id, ip);

    if (dto.fingerprint) {
      await this.trackingService.trackFingerprint(dataRecord.id, dto.fingerprint, {
        userAgent: dto.userAgent ?? req.headers['user-agent'],
        screenResolution: dto.screenResolution,
        language: dto.language,
        timezone: dto.timezone,
      });
    }

    return this.trackingService.trackEvent(dataRecord.id, ip, dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  @Post('events/batch')
  async trackBatch(
    @Req() req: express.Request,
    @Body(new ZodValidationPipe(TrackBatchSchema)) dto: TrackBatchDto,
  ) {
    const ip = this.extractIp(req);
    const userId = (req as express.Request & { userId?: string }).userId;
    const dataRecord = await this.trackingService.ensureDataRecord(userId);
    return this.trackingService.trackBatch(dataRecord.id, ip, dto.events);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('sessions')
  async startSession(
    @Req() req: express.Request,
    @Body(new ZodValidationPipe(StartSessionSchema)) dto: StartSessionDto,
  ) {
    const ip = this.extractIp(req);
    const userId = (req as express.Request & { userId?: string }).userId;
    const dataRecord = await this.trackingService.ensureDataRecord(userId);

    if (dto.fingerprint) {
      await this.trackingService.trackFingerprint(dataRecord.id, dto.fingerprint, {
        userAgent: dto.userAgent ?? req.headers['user-agent'],
        screenResolution: dto.screenResolution,
        language: dto.language,
        timezone: dto.timezone,
      });
    }

    return this.trackingService.startSession(dataRecord.id, ip, dto);
  }

  @Public()
  @Post('sessions/:id/end')
  async endSession(
    @Param('id') id: string,
    @Body() body: { exitUrl?: string },
  ) {
    return this.trackingService.endSession(id, body.exitUrl);
  }

  // ── Admin endpoints (guards are global; @Roles triggers RolesGuard) ────

  /** 360-degree user data view (admin only). */
  @Get('admin/records/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  getUserProfile(@Param('id') id: string) {
    return this.trackingService.getUserProfile(id);
  }

  /** Search user data records (admin only). */
  @Get('admin/records')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  searchRecords(
    @Query('q') q?: string,
    @Query(new ZodValidationPipe(PaginationSchema)) pagination?: PaginationDto,
  ) {
    return this.trackingService.searchRecords(
      q ?? '',
      pagination?.page ?? 1,
      pagination?.limit ?? 20,
    );
  }

  /** Returns the data record for the current user (self-service). */
  @Get('me')
  @ApiBearerAuth()
  async getMyData(@CurrentUser() userId: string) {
    const record = await this.trackingService.ensureDataRecord(userId);
    return this.trackingService.getUserProfile(record.id);
  }

  private extractIp(req: express.Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      ''
    );
  }
}
