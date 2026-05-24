import { Router } from 'express';
import { getNotifications, markNotificationAsRead, markAllAsRead } from '../controllers/notifications';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markNotificationAsRead);

export default router;
