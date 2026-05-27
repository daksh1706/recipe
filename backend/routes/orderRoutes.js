import express from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getOrders)
  .post(protect, createOrder);

router.route('/:id/status')
  .put(protect, updateOrderStatus);

// Stripe compatibility stubs to prevent crashes if frontend requests them
router.post('/create-payment-intent', protect, (req, res) => res.json({ clientSecret: 'pi_mock_secret' }));
router.post('/create-checkout-session', protect, (req, res) => res.json({ url: '/payment-success' }));
router.post('/confirm-payment', protect, (req, res) => res.json({ success: true }));

export default router;
