import { z } from 'zod';

export const listMembersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional()
});
