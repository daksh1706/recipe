import express from 'express';
import { getStaffRoster, saveStaffRoster, deleteStaffRoster, getStaffPerformance } from '../controllers/staffController.js';
import { protect, adminOnly, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/roster')
  .get(protect, getStaffRoster)
  .post(protect, managerOrAdmin, saveStaffRoster);

router.delete('/roster/:id', protect, managerOrAdmin, deleteStaffRoster);

router.get('/performance', protect, managerOrAdmin, getStaffPerformance);

export default router;
