import express from 'express';
import { 
  getAllCustomers, 
  getCustomerProfile, 
  getCustomerByPhone, 
  addCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../controllers/customerController.js';
import { protect, managerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllCustomers)
  .post(protect, addCustomer);

router.get('/phone/:phone', protect, getCustomerByPhone); // search lookup
router.get('/:phone', protect, getCustomerByPhone); // compatibility lookup fallback

router.route('/profile/:id')
  .get(protect, getCustomerProfile);

router.route('/:id')
  .put(protect, updateCustomer)
  .delete(protect, managerOrAdmin, deleteCustomer);

export default router;
