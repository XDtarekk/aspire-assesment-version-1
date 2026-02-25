import { z } from 'zod';
export declare const checkoutSchema: z.ZodObject<{
    bookId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    bookId: string;
}, {
    bookId: string;
}>;
export declare const returnSchema: z.ZodObject<{
    loanId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    loanId: string;
}, {
    loanId: string;
}>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
