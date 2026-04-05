import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationDto = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Builds a Prisma-compatible skip/take object from validated pagination params. */
export function buildPaginationArgs(dto: PaginationDto) {
  return {
    skip: (dto.page - 1) * dto.limit,
    take: dto.limit,
  };
}

/** Wraps items and meta into a standard paginated response shape. */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  dto: PaginationDto,
): PaginatedResponse<T> {
  return {
    items,
    meta: {
      page: dto.page,
      limit: dto.limit,
      total,
      totalPages: Math.ceil(total / dto.limit),
    },
  };
}
