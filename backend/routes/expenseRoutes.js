import express from 'express';
import { getExpenses, getExpenseSummary, addExpense, updateExpense, deleteExpense } from '../controllers/expenseController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getExpenses)
  .post(protect, addExpense);

router.get('/summary', protect, getExpenseSummary);

router.route('/:id')
  .put(protect, managerOrAdmin, updateExpense)
  .delete(protect, managerOrAdmin, deleteExpense);

export default router;
