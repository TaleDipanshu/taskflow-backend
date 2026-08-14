import { Response } from 'express';
import { PaginationMeta } from '../types/pagination.types';
import { ErrorCode } from '../constants/errorCodes.constant';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): Response => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: ErrorCode | string,
  message: string,
  details?: unknown
): Response => {
  const responsePayload: {
    success: boolean;
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  } = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {})
    }
  };

  return res.status(statusCode).json(responsePayload);
};
