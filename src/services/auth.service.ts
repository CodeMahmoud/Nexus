import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { Errors } from '../utils/errors';

export class AuthService {
  async register(email: string, username: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();
    const hashedPassword = await hashPassword(password);

    try {
      const user = await userRepository.create({
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
      });

      const token = signToken(user.id);
      return {
        token,
        user: { id: user.id, email: user.email, username: user.username },
      };
    } catch (error: any) {
      // Handle Prisma unique constraint violation (Race condition fix)
      if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('email')) throw Errors.conflict('A user with this email already exists');
        if (target.includes('username')) throw Errors.conflict('This username is already taken');
        throw Errors.conflict('Account already exists');
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);

    // Timing attack mitigation: always run bcrypt comparison even if user doesn't exist
    // Using a dummy hash from "dummy" so the comparison takes roughly the same time
    const dummyHash = '$2b$10$EPbF3P9zR99/m4m.2QZ8q.8Y/e1P0G1C2g1o.tWq7zZ4k0X5A6vQG'; 
    const isValid = await comparePassword(password, user ? user.password : dummyHash);

    if (!user || !isValid) {
      throw Errors.unauthorized('Invalid email or password');
    }

    const token = signToken(user.id);
    return {
      token,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }
}

export const authService = new AuthService();
