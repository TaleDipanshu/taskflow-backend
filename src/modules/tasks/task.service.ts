import { taskRepository, TaskFilterParams, UpdateTaskData } from './task.repository';
import { projectRepository } from '../projects/project.repository';
import { userRepository } from '../users/user.repository';
import { notificationRepository } from '../notifications/notification.repository';
import { PaginationParams, PaginatedResult } from '../../common/types/pagination.types';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { NotFoundError, BadRequestError } from '../../common/errors/app.error';
import { NOTIFICATION_TYPE } from '../../common/constants/notification.constant';
import { TaskStatus, TaskPriority } from '../../common/constants/task.constant';
import { ITask } from './task.model';

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export class TaskService {
  async listTasks(
    organizationId: string,
    filters: TaskFilterParams,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ITask>> {
    const [tasks, total] = await Promise.all([
      taskRepository.findByOrgWithFilters(organizationId, filters, pagination),
      taskRepository.countByOrgWithFilters(organizationId, filters)
    ]);

    const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
    return {
      data: tasks,
      meta
    };
  }

  async getTaskDetails(taskId: string, organizationId: string): Promise<ITask> {
    const task = await taskRepository.findByIdAndOrg(taskId, organizationId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    return task;
  }

  async createTask(
    input: CreateTaskInput,
    organizationId: string,
    createdById: string
  ): Promise<ITask> {
    const projectExists = await projectRepository.existsInOrg(input.projectId, organizationId);
    if (!projectExists) {
      throw new NotFoundError('Project not found in your organization');
    }

    return taskRepository.create({
      title: input.title,
      description: input.description || '',
      projectId: input.projectId,
      organizationId,
      createdById,
      priority: input.priority,
      dueDate: input.dueDate || null
    });
  }

  async updateTask(
    taskId: string,
    organizationId: string,
    data: UpdateTaskData
  ): Promise<ITask> {
    const task = await taskRepository.updateByIdAndOrg(taskId, organizationId, data);
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    return task;
  }

  async deleteTask(taskId: string, organizationId: string): Promise<void> {
    const task = await taskRepository.findRawByIdAndOrg(taskId, organizationId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await notificationRepository.deleteByTaskId(taskId);
    await taskRepository.deleteByIdAndOrg(taskId, organizationId);
  }

  async updateTaskStatus(
    taskId: string,
    organizationId: string,
    status: TaskStatus
  ): Promise<ITask> {
    const task = await taskRepository.updateByIdAndOrg(taskId, organizationId, { status });
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    return task;
  }

  async updateTaskPriority(
    taskId: string,
    organizationId: string,
    priority: TaskPriority
  ): Promise<ITask> {
    const task = await taskRepository.updateByIdAndOrg(taskId, organizationId, { priority });
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    return task;
  }

  async assignTask(
    taskId: string,
    organizationId: string,
    targetUserId: string
  ): Promise<ITask> {
    // 1. Verify task exists in the organization
    const task = await taskRepository.findRawByIdAndOrg(taskId, organizationId);
    if (!task) {
      throw new NotFoundError('Task not found in your organization');
    }

    // 2. Verify target user exists and belongs to the same organization
    const userInOrg = await userRepository.existsInOrganization(targetUserId, organizationId);
    if (!userInOrg) {
      throw new BadRequestError('Target user does not belong to your organization');
    }

    // 3. Update task assignee
    const updatedTask = await taskRepository.updateByIdAndOrg(taskId, organizationId, {
      assigneeId: targetUserId
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found');
    }

    // 4. Create notification for assigned user
    await notificationRepository.create({
      userId: targetUserId,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      title: 'New task assigned',
      message: `You have been assigned to task: "${task.title}"`,
      taskId: task._id
    });

    return updatedTask;
  }

  async unassignTask(taskId: string, organizationId: string): Promise<ITask> {
    const task = await taskRepository.findRawByIdAndOrg(taskId, organizationId);
    if (!task) {
      throw new NotFoundError('Task not found in your organization');
    }

    const updatedTask = await taskRepository.updateByIdAndOrg(taskId, organizationId, {
      assigneeId: null
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found');
    }

    return updatedTask;
  }
}

export const taskService = new TaskService();
