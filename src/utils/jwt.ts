import jwt, { Secret, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { config } from '../config';
import { randomUUID } from 'crypto';

export interface JwtPayload {
  sub: string;     // Standard JWT claim for Subject (the User ID)
  jti: string;     // Standard JWT claim for JWT ID (unique token identifier)
  type: string;    // Custom claim to distinguish token types (access vs refresh)
}

/**
 * Sign a secure JWT.
 */
export function signToken(
  userId: string, 
  expiresIn: string | number = '1h' // Better expiration strategy: short-lived access tokens
): string {
  const secret: Secret = config.jwt.secret;
  
  // Better payload design: Use standard claims + add uniqueness
  const payload: JwtPayload = {
    sub: userId,
    jti: randomUUID(), // Prevents exact replay attacks and enables future blacklisting
    type: 'access',    // Prepares the architecture for access/refresh rotation
  };

  const options: SignOptions = {
    expiresIn: expiresIn as unknown as number,
    algorithm: 'HS256',          // Secure signing: Explicitly prevent "none" or asymmetric downgrade attacks
    issuer: 'poketcg-nexus-api', // Security: Restricts who issued the token
    audience: 'nexus-frontend',  // Security: Restricts who the token is intended for
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Verify and decode a JWT. Returns the payload or throws.
 */
export function verifyToken(token: string): JwtPayload {
  const options: VerifyOptions = {
    algorithms: ['HS256'],       // Security: Strict validation of the algorithm used
    issuer: 'poketcg-nexus-api', // Security: Verify issuer
    audience: 'nexus-frontend',  // Security: Verify audience
  };

  return jwt.verify(token, config.jwt.secret as Secret, options) as JwtPayload;
}
