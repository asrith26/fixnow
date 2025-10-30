const express = require('express');
const {
  createBooking,
  getUserBookings,
  updateBooking,
  updateBookingStatus,
  deleteBooking
} = require('../controllers/bookingController');
const auth = require('../middleware/auth');

const router = express.Router();

// All booking routes require authentication
router.use(auth);

// Create a new booking
router.post('/', createBooking);

// Get all bookings for the authenticated user
router.get('/', getUserBookings);

// Update booking details
router.put('/:id', updateBooking);

// Update booking status
router.patch('/:id/status', updateBookingStatus);

// Delete a booking
router.delete('/:id', deleteBooking);

module.exports = router;
