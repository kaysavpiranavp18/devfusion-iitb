import { Router } from 'express';
import { signUp, login, logout, getMe } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/signup', signUp);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);

export default router;
