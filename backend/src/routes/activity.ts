import { Router } from 'express';
import { getActivities } from '../controllers/activity';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/workspace/:workspaceId', getActivities);

export default router;
