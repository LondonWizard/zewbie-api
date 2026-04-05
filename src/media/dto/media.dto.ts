import { z } from 'zod';

export const UploadUrlSchema = z.object({
  folder: z.string().regex(/^[a-zA-Z0-9_\-/]+$/, 'Invalid folder path'),
  filename: z.string().regex(/^[a-zA-Z0-9_\-.]+$/, 'Invalid filename'),
  contentType: z.string().min(1),
});

export type UploadUrlDto = z.infer<typeof UploadUrlSchema>;
