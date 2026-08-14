import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import {
  notificationIdParamSchema,
  listNotificationsQuerySchema
} from './notification.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateRequest({ query: listNotificationsQuerySchema }),
  notificationController.listNotifications
);

router.patch(
  '/:notificationId/read',
  validateRequest({ params: notificationIdParamSchema }),
  notificationController.markAsRead
);

export default router;
