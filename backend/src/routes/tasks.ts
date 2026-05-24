import { Router } from 'express';
import { 
  getTasks, createTask, getTaskById, 
  updateTask, deleteTask, moveTask 
} from '../controllers/tasks';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', getTasks);
router.post('/project/:projectId', createTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.put('/:id/move', moveTask);

export default router;
