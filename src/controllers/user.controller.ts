import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { collectionService } from '../services/collection.service';

export class UserController {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await userService.getUserById(id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async getCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const items = await collectionService.getUserCollection(id);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
