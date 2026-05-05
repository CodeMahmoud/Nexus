/**
 * Custom application error with HTTP status code and machine-readable error code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Capture correct stack trace
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Pre-built error factories ─────────────────────

export const Errors = {
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  badRequest: (message: string) =>
    new AppError(message, 400, 'BAD_REQUEST'),

  unauthorized: (message = 'Authentication required') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Insufficient permissions') =>
    new AppError(message, 403, 'FORBIDDEN'),

  conflict: (message: string) =>
    new AppError(message, 409, 'CONFLICT'),

  tooManyRequests: (message = 'Rate limit exceeded') =>
    new AppError(message, 429, 'TOO_MANY_REQUESTS'),

  internal: (message = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),

  externalApi: (message: string) =>
    new AppError(message, 502, 'EXTERNAL_API_ERROR'),
} as const;
