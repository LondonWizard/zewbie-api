import { z } from 'zod';

export const AddTrackingSchema = z.object({
  orderId: z.string().uuid(),
  carrier: z.enum(['USPS', 'UPS', 'FedEx']),
  trackingNumber: z.string().min(1).max(100),
});

export type AddTrackingDto = z.infer<typeof AddTrackingSchema>;
