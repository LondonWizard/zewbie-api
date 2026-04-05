import { z } from 'zod';

export const ReviewRetailerSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
});

export type ReviewRetailerDto = z.infer<typeof ReviewRetailerSchema>;
