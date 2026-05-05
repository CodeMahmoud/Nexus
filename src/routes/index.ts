import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import cardRoutes from './card.routes';
import collectionRoutes from './collection.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cards', cardRoutes);
router.use('/collections', collectionRoutes);

export default router;
