import { z } from 'zod';

export const checkoutSchema = z.object({
  bookId: z.string().uuid(),
});

export const returnSchema = z.object({
  loanId: z.string().uuid(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
