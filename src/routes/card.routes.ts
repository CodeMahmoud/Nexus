import { Router } from 'express';
import { cardController } from '../controllers/card.controller';

const router = Router();

// Order matters: /search must come before /:id to avoid "search" being treated as an ID
router.get('/search', (req, res, next) => cardController.search(req, res, next));
router.get('/', (req, res, next) => cardController.getAll(req, res, next));
router.get('/:id', (req, res, next) => cardController.getById(req, res, next));

export default router;
