import { z } from 'zod';
export declare const createBookSchema: z.ZodObject<{
    title: z.ZodString;
    author: z.ZodString;
    isbn: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    author: string;
    tags: string[];
    isbn?: string | undefined;
    description?: string | undefined;
    imageUrl?: string | null | undefined;
}, {
    title: string;
    author: string;
    isbn?: string | undefined;
    description?: string | undefined;
    imageUrl?: string | null | undefined;
    tags?: string[] | undefined;
}>;
export declare const updateBookSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    isbn: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodOptional<z.ZodNativeEnum<{
        AVAILABLE: "AVAILABLE";
        CHECKED_OUT: "CHECKED_OUT";
        ARCHIVED: "ARCHIVED";
    }>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    author?: string | undefined;
    isbn?: string | null | undefined;
    description?: string | null | undefined;
    status?: "AVAILABLE" | "CHECKED_OUT" | "ARCHIVED" | undefined;
    imageUrl?: string | null | undefined;
    tags?: string[] | undefined;
}, {
    title?: string | undefined;
    author?: string | undefined;
    isbn?: string | null | undefined;
    description?: string | null | undefined;
    status?: "AVAILABLE" | "CHECKED_OUT" | "ARCHIVED" | undefined;
    imageUrl?: string | null | undefined;
    tags?: string[] | undefined;
}>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
