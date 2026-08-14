import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { JwtPayload } from '../types/auth.types';
import { UnauthorizedError } from '../errors/app.error';
import { generateSecureRandomString } from './hash.util';

export const signAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: (env.ACCESS_TOKEN_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
    jwtid: generateSecureRandomString(16)
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: (env.REFRESH_TOKEN_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    jwtid: generateSecureRandomString(16)
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    return {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token has expired', { expiredAt: error.expiredAt });
    }
    throw new UnauthorizedError('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    return {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token has expired', { expiredAt: error.expiredAt });
    }
    throw new UnauthorizedError('Invalid refresh token');
  }
};
