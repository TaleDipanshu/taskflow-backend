import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { parsePagination } from '../../common/utils/pagination.util';
import { sendSuccess, sendPaginated } from '../../common/utils/response.util';
import { UnauthorizedError } from '../../common/errors/app.error';

export class NotificationController {
  async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const pagination = parsePagination(req.query);
      const result = await notificationService.listNotifications(req.user.userId, pagination);
      sendPaginated(res, result.data, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { notificationId } = req.params;
      const notification = await notificationService.markAsRead(
        notificationId,
        req.user.userId
      );
      sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
