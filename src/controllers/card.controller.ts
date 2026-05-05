import { Request, Response, NextFunction } from 'express';
import { cardService } from '../services/card.service';
import { Supertype } from '@prisma/client';

export class CardController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const filters = {
        name: req.query.name as string | undefined,
        setId: req.query.setId as string | undefined,
        supertype: req.query.supertype as Supertype | undefined,
        rarity: req.query.rarity as string | undefined,
        types: req.query.types as string | undefined,
      };

      const result = await cardService.getCards(filters, page, limit);

      res.json({
        success: true,
        data: result.cards,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const card = await cardService.getCardById(id);
      res.json({ success: true, data: card });
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await cardService.searchCards(query, page, limit);

      res.json({
        success: true,
        data: result.cards,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cardController = new CardController();
