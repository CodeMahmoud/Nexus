import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ApiResponse } from '../types';

/**
 * Global error handling middleware.
 * Catches all errors thrown or passed via next() and returns
 * a consistent JSON error envelope.
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational errors we created intentionally
  if (err instanceof AppError) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    console.error('Prisma Error:', err);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Unexpected errors — log full details server-side, return generic message
  console.error('Unhandled error:', err);

  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'An unexpected error occurred',
    },
  };
  res.status(500).json(response);
}
