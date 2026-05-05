import { Router } from 'express';
import { z } from 'zod';
import { collectionController } from '../controllers/collection.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

const addCardSchema = z.object({
  cardId: z.string().min(1, 'cardId is required'),
  quantity: z.number().int().positive().optional().default(1),
  notes: z.string().max(500).optional(),
});

const removeCardSchema = z.object({
  cardId: z.string().min(1, 'cardId is required'),
});

router.post('/add', authMiddleware, validate(addCardSchema), (req, res, next) => collectionController.addCard(req, res, next));
router.delete('/remove', authMiddleware, validate(removeCardSchema), (req, res, next) => collectionController.removeCard(req, res, next));

export default router;
