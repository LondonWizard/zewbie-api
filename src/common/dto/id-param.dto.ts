import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
});

export type IdParamDto = z.infer<typeof IdParamSchema>;
