import { z } from 'zod';

export const ConnectIntegrationSchema = z.object({
  storeId: z.string().uuid(),
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'PINTEREST', 'YOUTUBE']),
  accessToken: z.string().min(1),
});

export type ConnectIntegrationDto = z.infer<typeof ConnectIntegrationSchema>;
