import { Router } from 'express';
import { getComments, createComment, deleteComment } from '../controllers/comments';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/task/:taskId', getComments);
router.post('/task/:taskId', createComment);
router.delete('/:id', deleteComment);

export default router;
