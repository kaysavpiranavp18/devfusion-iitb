import { Router } from 'express';
import { getSnippets, createSnippet, updateSnippet, deleteSnippet } from '../controllers/snippets';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', getSnippets);
router.post('/project/:projectId', createSnippet);
router.put('/:id', updateSnippet);
router.delete('/:id', deleteSnippet);

export default router;
