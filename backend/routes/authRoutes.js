import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser); // Open to public, but requires admin approval
router.post('/login', loginUser);
router.get('/me', protect, getMe);

export default router;
