import express from 'express';
import { getWasteLogs, addWasteLog, getWasteSummary } from '../controllers/wasteController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getWasteLogs)
  .post(protect, addWasteLog);

router.get('/summary', protect, getWasteSummary);

export default router;
