import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { sendSuccess } from '../../common/utils/response.util';
import { UnauthorizedError } from '../../common/errors/app.error';

export class UserController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const profile = await userService.getCurrentUserProfile(req.user.userId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
