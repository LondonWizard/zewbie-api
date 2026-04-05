import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackEventDto, StartSessionDto } from './dto/tracking.dto';
import type { Prisma } from '@prisma/client';

/**
 * Comprehensive user data collection service.
 * Tracks events, sessions, IP history, device fingerprints,
 * and maintains a permanent user data record.
 */
@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Ensures a UserDataRecord exists for the given user or anonymous visitor.
   * Creates one if not found.
   */
  async ensureDataRecord(userId?: string, email?: string) {
    if (userId) {
      const existing = await this.prisma.userDataRecord.findUnique({
        where: { userId },
      });
      if (existing) return existing;

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      return this.prisma.userDataRecord.create({
        data: {
          userId,
          email: user?.email ?? email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          role: user?.role ?? 'CONSUMER',
          clerkId: user?.clerkId,
        },
      });
    }

    if (email) {
      const existing = await this.prisma.userDataRecord.findFirst({
        where: { email },
      });
      if (existing) return existing;
    }

    return this.prisma.userDataRecord.create({
      data: { email, role: 'CONSUMER' },
    });
  }

  /** Records an IP address for a user data record with geo-enrichment placeholder. */
  async trackIp(dataRecordId: string, ipAddress: string) {
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') return;

    const existing = await this.prisma.iPHistory.findUnique({
      where: {
        userDataRecordId_ipAddress: { userDataRecordId: dataRecordId, ipAddress },
      },
    });

    if (existing) {
      return this.prisma.iPHistory.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: new Date(),
          requestCount: { increment: 1 },
        },
      });
    }

    return this.prisma.iPHistory.create({
      data: {
        userDataRecordId: dataRecordId,
        ipAddress,
        // TODO: Geo-enrichment via IP geolocation API
      },
    });
  }

  /** Records or updates a device fingerprint for a user data record. */
  async trackFingerprint(
    dataRecordId: string,
    fingerprintHash: string,
    metadata: {
      userAgent?: string;
      screenResolution?: string;
      language?: string;
      timezone?: string;
    },
  ) {
    const existing = await this.prisma.deviceFingerprint.findUnique({
      where: {
        userDataRecordId_fingerprintHash: {
          userDataRecordId: dataRecordId,
          fingerprintHash,
        },
      },
    });

    const deviceType = this.detectDeviceType(metadata.userAgent);
    const { browserName, browserVersion } = this.parseBrowser(metadata.userAgent);
    const { osName, osVersion } = this.parseOS(metadata.userAgent);

    if (existing) {
      return this.prisma.deviceFingerprint.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: new Date(),
          sessionCount: { increment: 1 },
        },
      });
    }

    return this.prisma.deviceFingerprint.create({
      data: {
        userDataRecordId: dataRecordId,
        fingerprintHash,
        userAgent: metadata.userAgent,
        browserName,
        browserVersion,
        osName,
        osVersion,
        deviceType,
        screenResolution: metadata.screenResolution,
        language: metadata.language,
        timezone: metadata.timezone,
      },
    });
  }

  /** Starts a new session for tracking. */
  async startSession(dataRecordId: string, ipAddress: string, dto: StartSessionDto) {
    const session = await this.prisma.userSession.create({
      data: {
        userDataRecordId: dataRecordId,
        ipAddress,
        referrer: dto.referrer,
        entryUrl: dto.entryUrl,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        utmTerm: dto.utmTerm,
        utmContent: dto.utmContent,
      },
    });

    await this.prisma.userDataRecord.update({
      where: { id: dataRecordId },
      data: { lastSeenAt: new Date() },
    });

    return session;
  }

  /** Ends a session, recording duration and exit URL. */
  async endSession(sessionId: string, exitUrl?: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return null;

    const duration = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000,
    );

    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        duration,
        exitUrl,
      },
    });
  }

  /** Tracks a single event. */
  async trackEvent(dataRecordId: string, ipAddress: string, dto: TrackEventDto) {
    const event = await this.prisma.userEvent.create({
      data: {
        userDataRecordId: dataRecordId,
        sessionId: dto.sessionId,
        eventType: dto.eventType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        metadata: dto.metadata as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    if (dto.sessionId) {
      await this.prisma.userSession.update({
        where: { id: dto.sessionId },
        data: { pagesViewed: { increment: 1 } },
      }).catch(() => { /* session may not exist */ });
    }

    return event;
  }

  /** Tracks a batch of events. */
  async trackBatch(dataRecordId: string, ipAddress: string, events: TrackEventDto[]) {
    const results = await Promise.all(
      events.map((e) => this.trackEvent(dataRecordId, ipAddress, e)),
    );
    return { tracked: results.length };
  }

  /**
   * Returns the full 360-degree user view for admin.
   * Includes all collected data: IPs, devices, sessions, events, sales.
   */
  async getUserProfile(dataRecordId: string) {
    return this.prisma.userDataRecord.findUnique({
      where: { id: dataRecordId },
      include: {
        user: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            role: true, status: true, lastLoginAt: true, createdAt: true,
          },
        },
        ipHistory: { orderBy: { lastSeenAt: 'desc' }, take: 50 },
        deviceFingerprints: { orderBy: { lastSeenAt: 'desc' }, take: 20 },
        sessions: { orderBy: { startedAt: 'desc' }, take: 50 },
        events: { orderBy: { createdAt: 'desc' }, take: 100 },
        salesAsUser: { orderBy: { createdAt: 'desc' }, take: 50 },
        salesAsConsumer: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
  }

  /** Admin search across user data records. */
  async searchRecords(
    query: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const where = query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' as const } },
            { firstName: { contains: query, mode: 'insensitive' as const } },
            { lastName: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.userDataRecord.findMany({
        where,
        orderBy: { lastSeenAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { email: true, firstName: true, lastName: true, role: true } },
          _count: {
            select: { ipHistory: true, deviceFingerprints: true, sessions: true, events: true },
          },
        },
      }),
      this.prisma.userDataRecord.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private detectDeviceType(userAgent?: string): 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN' {
    if (!userAgent) return 'UNKNOWN';
    const ua = userAgent.toLowerCase();
    if (/tablet|ipad/.test(ua)) return 'TABLET';
    if (/mobile|android|iphone/.test(ua)) return 'MOBILE';
    if (/windows|macintosh|linux/.test(ua)) return 'DESKTOP';
    return 'UNKNOWN';
  }

  private parseBrowser(userAgent?: string) {
    if (!userAgent) return { browserName: undefined, browserVersion: undefined };
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)[/\s](\d+(\.\d+)?)/);
    return {
      browserName: match?.[1],
      browserVersion: match?.[2],
    };
  }

  private parseOS(userAgent?: string) {
    if (!userAgent) return { osName: undefined, osVersion: undefined };
    if (/windows nt (\d+\.\d+)/i.test(userAgent)) {
      return { osName: 'Windows', osVersion: RegExp.$1 };
    }
    if (/mac os x (\d+[._]\d+)/i.test(userAgent)) {
      return { osName: 'macOS', osVersion: RegExp.$1.replace('_', '.') };
    }
    if (/linux/i.test(userAgent)) {
      return { osName: 'Linux', osVersion: undefined };
    }
    if (/android (\d+(\.\d+)?)/i.test(userAgent)) {
      return { osName: 'Android', osVersion: RegExp.$1 };
    }
    if (/iphone os (\d+[._]\d+)/i.test(userAgent)) {
      return { osName: 'iOS', osVersion: RegExp.$1.replace('_', '.') };
    }
    return { osName: undefined, osVersion: undefined };
  }
}
