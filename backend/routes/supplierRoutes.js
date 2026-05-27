import express from 'express';
import { getSuppliers, getSupplierById, addSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, managerOrAdmin, addSupplier);

router.route('/:id')
  .get(protect, getSupplierById)
  .put(protect, managerOrAdmin, updateSupplier)
  .delete(protect, managerOrAdmin, deleteSupplier);

export default router;
