import express from 'express';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMenuItems)
  .post(protect, managerOrAdmin, addMenuItem);

router.route('/:id')
  .put(protect, managerOrAdmin, updateMenuItem)
  .delete(protect, managerOrAdmin, deleteMenuItem);

export default router;
