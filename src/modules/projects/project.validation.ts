import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
  description: z.string().max(500, 'Description is too long').optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name cannot be empty').max(100, 'Project name is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional()
});

export const projectIdParamSchema = z.object({
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID format')
});

export const listProjectsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional()
});
