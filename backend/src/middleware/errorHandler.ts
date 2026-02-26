import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function badRequest(message: string, code?: string): AppError {
  return new AppError(400, message, code ?? 'BAD_REQUEST');
}

export function unauthorized(message = 'Unauthorized'): AppError {
  return new AppError(401, message, 'UNAUTHORIZED');
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError(403, message, 'FORBIDDEN');
}

export function notFound(message = 'Resource not found'): AppError {
  return new AppError(404, message, 'NOT_FOUND');
}

export function errorHandler(
  err: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = err instanceof AppError ? err.statusCode : err.statusCode ?? 500;
  let code = err instanceof AppError ? err.code : err.code ?? 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 400;
      code = 'FILE_TOO_LARGE';
      message = 'File too large.';
    }
  }

  if (statusCode >= 500) console.error(err);
  res.status(statusCode).json({ message, code });
}
