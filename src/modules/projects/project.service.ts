import { projectRepository } from './project.repository';
import { taskRepository, TaskSummary } from '../tasks/task.repository';
import { notificationRepository } from '../notifications/notification.repository';
import { PaginationParams, PaginatedResult } from '../../common/types/pagination.types';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { NotFoundError } from '../../common/errors/app.error';
import { IProject } from './project.model';
import { ITask } from '../tasks/task.model';

export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  taskCount: number;
  progress: number;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDetailResponse {
  project: IProject;
  taskSummary: TaskSummary;
  tasks: ITask[];
}

export class ProjectService {
  async listProjects(
    organizationId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ProjectListItem>> {
    const [projects, total] = await Promise.all([
      projectRepository.findByOrg(organizationId, pagination),
      projectRepository.countByOrg(organizationId)
    ]);

    const projectItems: ProjectListItem[] = await Promise.all(
      projects.map(async (project) => {
        const summary = await taskRepository.countByProjectAndStatus(project._id, organizationId);
        const taskCount = summary.todo + summary.inProgress + summary.review + summary.done;
        const progress = taskCount > 0 ? Math.round((summary.done / taskCount) * 100) : 0;

        let status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' = 'TODO';
        if (taskCount > 0 && summary.done === taskCount) {
          status = 'COMPLETED';
        } else if (summary.inProgress > 0 || summary.review > 0 || summary.done > 0) {
          status = 'IN_PROGRESS';
        }

        return {
          id: project._id.toString(),
          name: project.name,
          description: project.description,
          taskCount,
          progress,
          status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        };
      })
    );

    const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
    return {
      data: projectItems,
      meta
    };
  }

  async getProjectDetails(projectId: string, organizationId: string): Promise<ProjectDetailResponse> {
    const project = await projectRepository.findByIdAndOrg(projectId, organizationId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const [taskSummary, tasks] = await Promise.all([
      taskRepository.countByProjectAndStatus(projectId, organizationId),
      taskRepository.findByProjectId(projectId, organizationId)
    ]);

    return {
      project,
      taskSummary,
      tasks
    };
  }

  async createProject(
    name: string,
    description: string | undefined,
    organizationId: string,
    createdById: string
  ): Promise<IProject> {
    return projectRepository.create({
      name,
      description: description || '',
      organizationId,
      createdById
    });
  }

  async updateProject(
    projectId: string,
    organizationId: string,
    data: { name?: string; description?: string }
  ): Promise<IProject> {
    const project = await projectRepository.updateByIdAndOrg(projectId, organizationId, data);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    return project;
  }

  async deleteProject(projectId: string, organizationId: string): Promise<void> {
    const project = await projectRepository.findByIdAndOrg(projectId, organizationId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Cascade delete tasks and associated notifications
    const { deletedTaskIds } = await taskRepository.deleteByProjectIdAndOrg(projectId, organizationId);
    if (deletedTaskIds.length > 0) {
      await notificationRepository.deleteByTaskIds(deletedTaskIds);
    }

    await projectRepository.deleteByIdAndOrg(projectId, organizationId);
  }
}

export const projectService = new ProjectService();
