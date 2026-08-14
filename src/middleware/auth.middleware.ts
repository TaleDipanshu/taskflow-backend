import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../common/utils/jwt.util';
import { UnauthorizedError } from '../common/errors/app.error';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication required: Bearer token missing');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new UnauthorizedError('Authentication token missing');
  }

  const payload = verifyAccessToken(token);

  req.user = {
    userId: payload.userId,
    organizationId: payload.organizationId,
    role: payload.role
  };

  next();
};
