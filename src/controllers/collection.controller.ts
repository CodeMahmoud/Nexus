import { Response, NextFunction } from 'express';
import { collectionService } from '../services/collection.service';
import { AuthenticatedRequest } from '../types';
import { Errors } from '../utils/errors';

export class CollectionController {
  async addCard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw Errors.unauthorized();

      const { cardId, quantity, notes } = req.body;
      const result = await collectionService.addCard(req.userId, cardId, quantity, notes);

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async removeCard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw Errors.unauthorized();

      const { cardId } = req.body;
      const result = await collectionService.removeCard(req.userId, cardId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const collectionController = new CollectionController();
