import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../common/errors/app.error';
import { ERROR_CODES } from '../common/constants/errorCodes.constant';
import { env } from '../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Operational AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {})
      }
    });
    return;
  }

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.BAD_REQUEST,
        message: `Invalid identifier format for field '${err.path}'`,
        details: { path: err.path, value: err.value }
      }
    });
    return;
  }

  // Mongoose duplicate key error (code 11000)
  if ((err as unknown as { code?: number }).code === 11000) {
    const keyPattern = (err as unknown as { keyPattern?: Record<string, number> }).keyPattern || {};
    const field = Object.keys(keyPattern)[0] || 'resource';
    res.status(409).json({
      success: false,
      error: {
        code: ERROR_CODES.CONFLICT,
        message: `A record with this ${field} already exists.`
      }
    });
    return;
  }

  // Mongoose schema validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key]?.message
    }));
    res.status(422).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Database schema validation failed',
        details
      }
    });
    return;
  }

  // JSON syntax error in request body
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Malformed JSON payload in request'
      }
    });
    return;
  }

  // Unhandled / Internal Server Error
  if (env.NODE_ENV !== 'test') {
    console.error('💥 Unhandled Exception:', err);
  }

  res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Internal server error'
    }
  });
};
