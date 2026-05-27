import express from 'express';
import { getDashboardKPIs, getDashboardCharts, getMonthlyReports, getDailyReport } from '../controllers/reportController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/kpis', protect, getDashboardKPIs);
router.get('/charts', protect, getDashboardCharts);
router.get('/monthly', protect, managerOrAdmin, getMonthlyReports);
router.get('/daily', protect, managerOrAdmin, getDailyReport);

export default router;
