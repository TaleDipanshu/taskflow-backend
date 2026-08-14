import { Router } from 'express';
import { organizationController } from './organization.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { listMembersQuerySchema } from './organization.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/members',
  validateRequest({ query: listMembersQuerySchema }),
  organizationController.getMembers
);

export default router;
