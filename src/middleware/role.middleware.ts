import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../common/constants/roles.constant';
import { ForbiddenError, UnauthorizedError } from '../common/errors/app.error';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('User is not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Access denied. Required role(s): ${allowedRoles.join(', ')}`);
    }

    next();
  };
};
