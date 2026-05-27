import express from 'express';
import { getFeedback, addFeedback, resolveFeedback, getFeedbackSummary } from '../controllers/feedbackController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getFeedback)
  .post(protect, addFeedback);

router.get('/summary', protect, getFeedbackSummary);

router.put('/:id/resolve', protect, managerOrAdmin, resolveFeedback);

export default router;
