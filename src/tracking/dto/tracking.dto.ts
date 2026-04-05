import { z } from 'zod';

export const TrackEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  entityType: z.string().max(100).optional(),
  entityId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  sessionId: z.string().uuid().optional(),
  fingerprint: z.string().max(500).optional(),
  userAgent: z.string().max(1000).optional(),
  screenResolution: z.string().max(20).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  referrer: z.string().max(2000).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  pageUrl: z.string().max(2000).optional(),
});

export type TrackEventDto = z.infer<typeof TrackEventSchema>;

export const TrackBatchSchema = z.object({
  events: z.array(TrackEventSchema).min(1).max(100),
});

export type TrackBatchDto = z.infer<typeof TrackBatchSchema>;

export const StartSessionSchema = z.object({
  fingerprint: z.string().max(500).optional(),
  userAgent: z.string().max(1000).optional(),
  screenResolution: z.string().max(20).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  referrer: z.string().max(2000).optional(),
  entryUrl: z.string().max(2000).optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
});

export type StartSessionDto = z.infer<typeof StartSessionSchema>;
