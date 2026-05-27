import express from 'express';
import { getAllUsers, getPendingUsers, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getAllUsers);
router.get('/pending', protect, adminOnly, getPendingUsers);
router.put('/:id', protect, adminOnly, updateUser);
router.put('/:id/status', protect, adminOnly, updateUser); // compatibility link
router.delete('/:id', protect, adminOnly, deleteUser);

export default router;
