import { notificationRepository } from './notification.repository';
import { PaginationParams, PaginatedResult } from '../../common/types/pagination.types';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { NotFoundError } from '../../common/errors/app.error';
import { INotification } from './notification.model';

export class NotificationService {
  async listNotifications(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<INotification>> {
    const [notifications, total] = await Promise.all([
      notificationRepository.findByUserId(userId, pagination),
      notificationRepository.countByUserId(userId)
    ]);

    const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
    return {
      data: notifications,
      meta
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await notificationRepository.markAsRead(notificationId, userId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    return notification;
  }
}

export const notificationService = new NotificationService();
