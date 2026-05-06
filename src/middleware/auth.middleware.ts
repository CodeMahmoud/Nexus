import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { Errors } from '../utils/errors';
import { AuthenticatedRequest } from '../types';

/**
 * JWT authentication middleware.
 * Extracts the token from the Authorization header, verifies it,
 * and attaches `req.userId` for downstream handlers.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw Errors.unauthorized('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    req.userId = payload.sub;
    next();
  } catch (error) {
    // If it's already our AppError, pass it through
    if (error instanceof Error && 'statusCode' in error) {
      next(error);
      return;
    }
    // JWT verification errors (expired, invalid, etc.)
    next(Errors.unauthorized('Invalid or expired token'));
  }
}
