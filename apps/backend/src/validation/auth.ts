import { z } from 'zod';

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const setPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
