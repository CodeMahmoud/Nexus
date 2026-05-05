import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/:id', authMiddleware, (req, res, next) => userController.getById(req, res, next));
router.get('/:id/collection', authMiddleware, (req, res, next) => userController.getCollection(req, res, next));

export default router;
