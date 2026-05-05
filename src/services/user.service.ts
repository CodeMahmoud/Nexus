import { userRepository } from '../repositories/user.repository';
import { Errors } from '../utils/errors';

export class UserService {
  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw Errors.notFound('User');
    }
    return user;
  }
}

export const userService = new UserService();
