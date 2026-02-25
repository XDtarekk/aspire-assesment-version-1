import { z } from 'zod';
import { BookStatus } from '@aspire/db';

export const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.union([z.string().url(), z.string().startsWith('/')]).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

export const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  isbn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.union([z.string().url(), z.string().startsWith('/')]).optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.nativeEnum(BookStatus).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
