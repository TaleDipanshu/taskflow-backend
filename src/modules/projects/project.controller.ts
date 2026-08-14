import { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service';
import { parsePagination } from '../../common/utils/pagination.util';
import { sendSuccess, sendPaginated } from '../../common/utils/response.util';
import { UnauthorizedError } from '../../common/errors/app.error';

export class ProjectController {
  async listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const pagination = parsePagination(req.query);
      const result = await projectService.listProjects(req.user.organizationId, pagination);
      sendPaginated(res, result.data, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getProjectDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      const result = await projectService.getProjectDetails(projectId, req.user.organizationId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { name, description } = req.body;
      const project = await projectService.createProject(
        name,
        description,
        req.user.organizationId,
        req.user.userId
      );
      sendSuccess(res, project, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      const { name, description } = req.body;
      const project = await projectService.updateProject(projectId, req.user.organizationId, {
        name,
        description
      });
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await projectService.deleteProject(projectId, req.user.organizationId);
      sendSuccess(res, { message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
