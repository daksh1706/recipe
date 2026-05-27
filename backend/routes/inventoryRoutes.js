import express from 'express';
import { 
  getRawMaterials, 
  addRawMaterial, 
  updateRawMaterial, 
  deleteRawMaterial, 
  restockRawMaterial, 
  getStockTransactions 
} from '../controllers/inventoryController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET and POST raw materials
router.route('/')
  .get(protect, getRawMaterials)
  .post(protect, managerOrAdmin, addRawMaterial);

// GET stock transaction logs
router.get('/transactions', protect, getStockTransactions);

// PUT, DELETE, and RESTOCK endpoints for raw materials
router.route('/:id')
  .put(protect, managerOrAdmin, updateRawMaterial)
  .delete(protect, managerOrAdmin, deleteRawMaterial);

router.post('/:id/restock', protect, restockRawMaterial);
router.post('/:id/prepare', protect, restockRawMaterial); // for backwards compatibility fallback

export default router;
