import { Types } from 'mongoose';
import { INotification, NotificationModel } from './notification.model';
import { NotificationType } from '../../common/constants/notification.constant';
import { PaginationParams } from '../../common/types/pagination.types';

export interface CreateNotificationData {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  taskId: string | Types.ObjectId;
}

export class NotificationRepository {
  async create(data: CreateNotificationData): Promise<INotification> {
    return NotificationModel.create(data);
  }

  async findByUserId(
    userId: string | Types.ObjectId,
    pagination: PaginationParams
  ): Promise<INotification[]> {
    const { page, limit } = pagination;
    return NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async countByUserId(userId: string | Types.ObjectId): Promise<number> {
    return NotificationModel.countDocuments({ userId });
  }

  async markAsRead(
    notificationId: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { readAt: new Date() } },
      { new: true }
    );
  }

  async findByIdAndUser(
    notificationId: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<INotification | null> {
    return NotificationModel.findOne({ _id: notificationId, userId });
  }

  async deleteByTaskIds(taskIds: (string | Types.ObjectId)[]): Promise<void> {
    await NotificationModel.deleteMany({ taskId: { $in: taskIds } });
  }

  async deleteByTaskId(taskId: string | Types.ObjectId): Promise<void> {
    await NotificationModel.deleteMany({ taskId });
  }
}

export const notificationRepository = new NotificationRepository();
