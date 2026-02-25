import { z } from 'zod';
export declare const enrichBookSchema: z.ZodObject<{
    title: z.ZodString;
    author: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    author: string;
}, {
    title: string;
    author: string;
}>;
export type EnrichBookInput = z.infer<typeof enrichBookSchema>;
