import express from 'express';
import { 
  createWorkspace, 
  joinWorkspace, 
  getWorkspaceInfo, 
  regenerateShareCode, 
  removeWorkspaceMember,
  getWorkspaceJoinStatus,
  cancelWorkspaceJoinRequest,
  approveWorkspaceMember,
  updateWorkspaceShareCode
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { workspaceProtect } from '../middleware/workspaceMiddleware.js';

const router = express.Router();

// Publicly accessible to logged-in users who do not have a workspace session yet
router.post('/create', protect, createWorkspace);
router.post('/join', protect, joinWorkspace);
router.get('/join-status', protect, getWorkspaceJoinStatus);
router.delete('/join-cancel', protect, cancelWorkspaceJoinRequest);

// Gated behind both auth validation and active workspace validation
router.get('/info', protect, workspaceProtect, getWorkspaceInfo);
router.put('/regenerate-code', protect, workspaceProtect, regenerateShareCode);
router.put('/update-code', protect, workspaceProtect, updateWorkspaceShareCode);
router.delete('/members/:userId', protect, workspaceProtect, removeWorkspaceMember);
router.put('/members/approve', protect, workspaceProtect, approveWorkspaceMember);

export default router;
