import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const RegisterRetailerSchema = RegisterSchema.extend({
  businessName: z.string().min(1).max(200),
  businessEmail: z.string().email(),
  taxId: z.string().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
});

export type RegisterRetailerDto = z.infer<typeof RegisterRetailerSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
