import { z } from 'zod';

export const UpdateRetailerProfileSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateRetailerProfileDto = z.infer<typeof UpdateRetailerProfileSchema>;

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().min(1).max(50),
  basePrice: z.number().min(0),
  category: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  isMadeToOrder: z.boolean().default(false),
  slaBusinessDays: z.number().int().min(1).default(5),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

export const CreateVariantSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export type CreateVariantDto = z.infer<typeof CreateVariantSchema>;
