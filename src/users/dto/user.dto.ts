import { z } from 'zod';

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const UpdateNotificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

export type UpdateNotificationSettingsDto = z.infer<typeof UpdateNotificationSettingsSchema>;
