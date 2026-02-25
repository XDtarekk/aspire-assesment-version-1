import { z } from 'zod';
import { Role } from '@aspire/db';

export const updateRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
