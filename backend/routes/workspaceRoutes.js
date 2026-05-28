import express from 'express';
import { 
  createWorkspace, 
  joinWorkspace, 
  getWorkspaceInfo, 
  regenerateShareCode, 
  removeWorkspaceMember 
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { workspaceProtect } from '../middleware/workspaceMiddleware.js';

const router = express.Router();

// Publicly accessible to logged-in users who do not have a workspace session yet
router.post('/create', protect, createWorkspace);
router.post('/join', protect, joinWorkspace);

// Gated behind both auth validation and active workspace validation
router.get('/info', protect, workspaceProtect, getWorkspaceInfo);
router.put('/regenerate-code', protect, workspaceProtect, regenerateShareCode);
router.delete('/members/:userId', protect, workspaceProtect, removeWorkspaceMember);

export default router;
