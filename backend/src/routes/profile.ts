import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);

export default router;
