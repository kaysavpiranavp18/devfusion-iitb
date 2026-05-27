import { Router } from 'express';
import { 
  getWorkspaces, createWorkspace, getWorkspaceById, 
  updateWorkspace, deleteWorkspace, inviteWorkspaceMember, 
  updateWorkspaceMemberRole, removeWorkspaceMember, acceptWorkspaceInvite
} from '../controllers/workspaces';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getWorkspaces);
router.post('/', createWorkspace);
router.post('/invite/accept', acceptWorkspaceInvite);
router.get('/:id', getWorkspaceById);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);

// Member management
router.post('/:id/invite', inviteWorkspaceMember);
router.put('/:id/members/:userId', updateWorkspaceMemberRole);
router.delete('/:id/members/:userId', removeWorkspaceMember);

export default router;

