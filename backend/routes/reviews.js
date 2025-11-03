const express = require('express');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Professional = require('../models/Professional');
const auth = require('../middleware/auth');

const router = express.Router();

// Get reviews for a professional
router.get('/professional/:professionalId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ professional: req.params.professionalId })
      .populate('reviewer', 'name')
      .populate('booking', 'service date status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ professional: req.params.professionalId });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { professional: require('mongoose').Types.ObjectId(req.params.professionalId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      stats: ratingStats[0] || { averageRating: 0, totalReviews: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a review
router.post('/', auth, async (req, res) => {
  try {
    const { bookingId, rating, comment, categories } = req.body;

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }

    // Get professional from booking (assuming booking has professional field)
    // For now, we'll need to add this to the booking model
    const professional = await Professional.findOne({ user: booking.professional }); // This needs to be updated

    const review = new Review({
      booking: bookingId,
      reviewer: req.user._id,
      professional: professional._id,
      rating,
      comment,
      categories,
      isVerified: true, // Since booking is completed
    });

    await review.save();
    await review.populate('reviewer', 'name');
    await review.populate('booking', 'service date');

    // Update professional's rating
    await updateProfessionalRating(professional._id);

    res.status(201).json({
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a review
router.put('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only allow the reviewer to update their review
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).populate('reviewer', 'name').populate('booking', 'service date');

    // Update professional's rating
    await updateProfessionalRating(review.professional);

    res.json({
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Professional respond to review
router.put('/:id/response', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('professional');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only allow the professional to respond
    if (review.professional.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    review.response = {
      comment: req.body.comment,
      respondedAt: new Date(),
    };

    await review.save();

    res.json({
      message: 'Response added successfully',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a review (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update professional's rating
    await updateProfessionalRating(review.professional);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to update professional rating
async function updateProfessionalRating(professionalId) {
  try {
    const result = await Review.aggregate([
      { $match: { professional: professionalId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if (result.length > 0) {
      await Professional.findByIdAndUpdate(professionalId, {
        rating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: result[0].reviewCount,
      });
    }
  } catch (error) {
    console.error('Error updating professional rating:', error);
  }
}

module.exports = router;
