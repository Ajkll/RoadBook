import { Router } from 'express';
import authRoutes from './auth.routes';
import roadbookRoutes from './roadbook.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/roadbooks', roadbookRoutes);
router.use('/users', userRoutes);
// Hello World route for testing
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello World from RoadBook API!' });
});

export default router;