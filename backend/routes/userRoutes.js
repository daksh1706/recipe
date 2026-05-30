import express from 'express';
import { getAllUsers, getPendingUsers, updateUser, deleteUser, adminCreateUser } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, managerOrAdmin, getAllUsers);
router.get('/pending', protect, adminOnly, getPendingUsers);
router.post('/admin-create', protect, adminOnly, adminCreateUser);
router.put('/:id', protect, adminOnly, updateUser);
router.put('/:id/status', protect, adminOnly, updateUser); // compatibility link
router.delete('/:id', protect, adminOnly, deleteUser);

export default router;
