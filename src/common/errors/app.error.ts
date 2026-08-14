import { ERROR_CODES, ErrorCode } from '../constants/errorCodes.constant';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, ERROR_CODES.BAD_REQUEST, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(401, ERROR_CODES.UNAUTHORIZED, message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: insufficient permissions', details?: unknown) {
    super(403, ERROR_CODES.FORBIDDEN, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(404, ERROR_CODES.NOT_FOUND, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details?: unknown) {
    super(409, ERROR_CODES.CONFLICT, message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details?: unknown) {
    super(422, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later', details?: unknown) {
    super(429, ERROR_CODES.RATE_LIMIT_EXCEEDED, message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(500, ERROR_CODES.INTERNAL_SERVER_ERROR, message, details);
  }
}
