import { z } from 'zod';
import { TASK_STATUS, TASK_PRIORITY } from '../../common/constants/task.constant';

const validObjectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const taskIdParamSchema = z.object({
  taskId: validObjectId
});

export const createTaskSchema = z.object({
  projectId: validObjectId,
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD or ISO 8601'))
    .optional()
    .nullable()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200, 'Title is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
  status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD or ISO 8601'))
    .optional()
    .nullable()
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]], {
    required_error: 'Status is required'
  })
});

export const updateTaskPrioritySchema = z.object({
  priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]], {
    required_error: 'Priority is required'
  })
});

export const assignTaskSchema = z.object({
  userId: validObjectId
});

export const listTasksQuerySchema = z.object({
  status: z.enum(Object.values(TASK_STATUS) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
  assigneeId: validObjectId.optional(),
  projectId: validObjectId.optional(),
  dueDateFrom: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'))
    .optional(),
  dueDateTo: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'))
    .optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional()
});
