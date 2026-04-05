import { z } from 'zod';

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1).default('US'),
}).passthrough();

export const CreateOrderSchema = z.object({
  storeId: z.string().uuid(),
  storeProductId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(200),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING', 'ACCEPTED', 'PROCESSING', 'MANUFACTURING',
    'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'DISPUTED',
  ]),
  note: z.string().max(500).optional(),
});

export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;
