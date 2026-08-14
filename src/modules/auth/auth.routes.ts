import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema
} from './auth.validation';

const router = Router();

router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login
);

router.post(
  '/refresh',
  validateRequest({ body: refreshTokenSchema }),
  authController.refresh
);

router.post(
  '/logout',
  validateRequest({ body: refreshTokenSchema }),
  authController.logout
);

router.post(
  '/forgot-password',
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

export default router;
