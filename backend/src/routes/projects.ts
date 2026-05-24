import { Router } from 'express';
import { 
  getProjects, createProject, getProjectById, 
  updateProject, deleteProject, addProjectMember, 
  removeProjectMember 
} from '../controllers/projects';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/workspace/:workspaceId', getProjects);
router.post('/workspace/:workspaceId', createProject);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Member management
router.post('/:id/members', addProjectMember);
router.delete('/:id/members/:userId', removeProjectMember);

export default router;
