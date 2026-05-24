import { Router } from 'express';
import { getWikiPages, createWikiPage, updateWikiPage, deleteWikiPage } from '../controllers/wiki';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', getWikiPages);
router.post('/project/:projectId', createWikiPage);
router.put('/:id', updateWikiPage);
router.delete('/:id', deleteWikiPage);

export default router;
