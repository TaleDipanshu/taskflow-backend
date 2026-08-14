import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../common/errors/app.error';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per 15 mins per IP (generous for tests/dev, protective for production)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many login/auth requests. Please try again later.'));
  },
  skip: () => process.env.NODE_ENV === 'test'
});
