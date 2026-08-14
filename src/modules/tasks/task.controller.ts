import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service';
import { parsePagination } from '../../common/utils/pagination.util';
import { sendSuccess, sendPaginated } from '../../common/utils/response.util';
import { UnauthorizedError } from '../../common/errors/app.error';
import { TaskPriority, TaskStatus } from '../../common/constants/task.constant';

export class TaskController {
  async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();

      const pagination = parsePagination(req.query);
      const filters = {
        status: req.query.status as TaskStatus | undefined,
        priority: req.query.priority as TaskPriority | undefined,
        assigneeId: req.query.assigneeId as string | undefined,
        projectId: req.query.projectId as string | undefined,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined
      };

      const result = await taskService.listTasks(req.user.organizationId, filters, pagination);
      sendPaginated(res, result.data, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getTaskDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { taskId } = req.params;
      const task = await taskService.getTaskDetails(taskId, req.user.organizationId);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId, title, description, priority, dueDate } = req.body;
      const task = await taskService.createTask(
        {
          projectId,
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null
        },
        req.user.organizationId,
        req.user.userId
      );
      sendSuccess(res, task, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { taskId } = req.params;
      const { title, description, status, priority, dueDate } = req.body;
      const task = await taskService.updateTask(taskId, req.user.organizationId, {
        title,
        description,
        status,
        priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined
      });
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { taskId } = req.params;
      await taskService.deleteTask(taskId, req.user.organizationId);
      sendSuccess(res, { message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { taskId } = req.params;
      const { status } = req.body;
      const task = await taskService.updateTaskStatus(taskId, req.user.organizationId, status);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async updatePriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { taskId } = req.params;
      const { priority } = req.body;
      const task = await taskService.updateTaskPriority(taskId, req.user.organizationId, priority);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async assignUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { taskId } = req.params;
      const { userId } = req.body;
      const task = await taskService.assignTask(taskId, req.user.organizationId, userId);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async unassignUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { taskId } = req.params;
      const task = await taskService.unassignTask(taskId, req.user.organizationId);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
