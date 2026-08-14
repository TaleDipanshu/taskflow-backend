import { Request, Response, NextFunction } from 'express';
import { organizationService } from './organization.service';
import { parsePagination } from '../../common/utils/pagination.util';
import { sendPaginated } from '../../common/utils/response.util';
import { UnauthorizedError } from '../../common/errors/app.error';

export class OrganizationController {
  async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const pagination = parsePagination(req.query);
      const result = await organizationService.getMembers(req.user.organizationId, pagination);

      sendPaginated(res, result.data, result.meta);
    } catch (error) {
      next(error);
    }
  }
}

export const organizationController = new OrganizationController();
