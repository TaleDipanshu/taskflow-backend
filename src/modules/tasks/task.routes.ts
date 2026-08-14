import { Router } from 'express';
import { taskController } from './task.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  updateTaskPrioritySchema,
  assignTaskSchema,
  taskIdParamSchema,
  listTasksQuerySchema
} from './task.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateRequest({ query: listTasksQuerySchema }),
  taskController.listTasks
);

router.get(
  '/:taskId',
  validateRequest({ params: taskIdParamSchema }),
  taskController.getTaskDetails
);

router.post(
  '/',
  validateRequest({ body: createTaskSchema }),
  taskController.createTask
);

router.patch(
  '/:taskId',
  validateRequest({ params: taskIdParamSchema, body: updateTaskSchema }),
  taskController.updateTask
);

router.delete(
  '/:taskId',
  validateRequest({ params: taskIdParamSchema }),
  taskController.deleteTask
);

router.patch(
  '/:taskId/status',
  validateRequest({ params: taskIdParamSchema, body: updateTaskStatusSchema }),
  taskController.updateStatus
);

router.patch(
  '/:taskId/priority',
  validateRequest({ params: taskIdParamSchema, body: updateTaskPrioritySchema }),
  taskController.updatePriority
);

router.patch(
  '/:taskId/assignee',
  validateRequest({ params: taskIdParamSchema, body: assignTaskSchema }),
  taskController.assignUser
);

router.delete(
  '/:taskId/assignee',
  validateRequest({ params: taskIdParamSchema }),
  taskController.unassignUser
);

export default router;
