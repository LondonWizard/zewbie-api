import { z } from 'zod';

const MAX_RANGE_DAYS = 365;

export const DateRangeSchema = z.object({
  startDate: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid start date'),
  endDate: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid end date'),
}).refine(
  (d) => {
    const diffMs = new Date(d.endDate).getTime() - new Date(d.startDate).getTime();
    return diffMs >= 0 && diffMs / (1000 * 60 * 60 * 24) <= MAX_RANGE_DAYS;
  },
  { message: `Date range must be positive and not exceed ${MAX_RANGE_DAYS} days` },
);

export type DateRangeDto = z.infer<typeof DateRangeSchema>;
