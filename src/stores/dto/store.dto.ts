import { z } from 'zod';

export const CreateStoreSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  templateId: z.string().uuid().optional(),
});

export type CreateStoreDto = z.infer<typeof CreateStoreSchema>;

export const UpdateStoreSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional(),
  favicon: z.string().url().optional(),
  gaTrackingId: z.string().max(50).optional(),
  fbPixelId: z.string().max(50).optional(),
  customCss: z.string().max(50000).optional(),
  seoMetadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateStoreDto = z.infer<typeof UpdateStoreSchema>;

export const UpdateThemeSchema = z.object({
  themeConfig: z.record(z.string(), z.unknown()),
});

export type UpdateThemeDto = z.infer<typeof UpdateThemeSchema>;

export const UpdateDomainSchema = z.object({
  domain: z.string().min(1).max(253),
});

export type UpdateDomainDto = z.infer<typeof UpdateDomainSchema>;

export const CreatePageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  content: z.record(z.string(), z.unknown()).default({}),
  pageType: z.string().default('custom'),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreatePageDto = z.infer<typeof CreatePageSchema>;

export const UpdatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdatePageDto = z.infer<typeof UpdatePageSchema>;
