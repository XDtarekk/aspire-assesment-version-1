import { z } from 'zod';

export const enrichBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
});

export type EnrichBookInput = z.infer<typeof enrichBookSchema>;
