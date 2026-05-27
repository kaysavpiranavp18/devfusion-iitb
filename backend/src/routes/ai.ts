import { Router } from 'express';
import { handleAIChat } from '../controllers/ai';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/chat', handleAIChat);

export default router;
