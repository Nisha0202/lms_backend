import express from 'express';
import { createCheckoutSession, verifyPaymentSession } from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// 1. Create a Stripe Session (User clicks "Enroll")
// POST /api/payment/create-checkout-session
router.post('/create-checkout-session', protect, createCheckoutSession);

// 2. Verify Payment (User returns from Stripe)
// POST /api/payment/verify-session
router.post('/verify-session', protect, verifyPaymentSession);

export default router;