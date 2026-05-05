import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config';

interface JwtPayload {
  userId: string;
}

/**
 * Sign a JWT with the user's ID.
 */
export function signToken(userId: string): string {
  const secret: Secret = config.jwt.secret;
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as unknown as number,
  };
  return jwt.sign({ userId } as JwtPayload, secret, options);
}

/**
 * Verify and decode a JWT. Returns the payload or throws.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret as Secret) as JwtPayload;
}
