import { Router } from 'express';
import { projectController } from './project.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { ROLES } from '../../common/constants/roles.constant';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  listProjectsQuerySchema
} from './project.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateRequest({ query: listProjectsQuerySchema }),
  projectController.listProjects
);

router.get(
  '/:projectId',
  validateRequest({ params: projectIdParamSchema }),
  projectController.getProjectDetails
);

router.post(
  '/',
  requireRole(ROLES.ADMIN),
  validateRequest({ body: createProjectSchema }),
  projectController.createProject
);

router.patch(
  '/:projectId',
  requireRole(ROLES.ADMIN),
  validateRequest({ params: projectIdParamSchema, body: updateProjectSchema }),
  projectController.updateProject
);

router.delete(
  '/:projectId',
  requireRole(ROLES.ADMIN),
  validateRequest({ params: projectIdParamSchema }),
  projectController.deleteProject
);

export default router;
