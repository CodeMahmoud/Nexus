import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../types';

/**
 * Factory that returns middleware for validating the request body
 * against a Zod schema.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), controller.register);
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as any).issues ?? (error as any).errors ?? [];
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: issues
              .map((e: { path: string[]; message: string }) => `${e.path.join('.')}: ${e.message}`)
              .join('; '),
          },
        };
        res.status(400).json(response);
        return;
      }
      next(error);
    }
  };
}
