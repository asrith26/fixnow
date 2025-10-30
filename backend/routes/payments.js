const express = require('express');
const {
  createPayment,
  getUserPayments,
  getPaymentById,
  updatePaymentStatus
} = require('../controllers/paymentController');
const auth = require('../middleware/auth');

const router = express.Router();

// All payment routes require authentication
router.use(auth);

// Create a new payment
router.post('/', createPayment);

// Get all payments for the authenticated user
router.get('/', getUserPayments);

// Get payment by ID
router.get('/:id', getPaymentById);

// Update payment status
router.patch('/:id/status', updatePaymentStatus);

module.exports = router;
