import { z } from 'zod';
export declare const updateRoleSchema: z.ZodObject<{
    role: z.ZodNativeEnum<{
        ADMIN: "ADMIN";
        LIBRARIAN: "LIBRARIAN";
        MEMBER: "MEMBER";
    }>;
}, "strip", z.ZodTypeAny, {
    role: "ADMIN" | "LIBRARIAN" | "MEMBER";
}, {
    role: "ADMIN" | "LIBRARIAN" | "MEMBER";
}>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
