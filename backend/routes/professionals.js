const express = require('express');
const Professional = require('../models/Professional');
const User = require('../models/User');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all verified professionals
router.get('/', async (req, res) => {
  try {
    const { service, location, radius = 25 } = req.query;

    let query = { verificationStatus: 'verified', isActive: true };

    // Filter by service if provided
    if (service) {
      query.services = service;
    }

    // Filter by location if provided
    if (location) {
      // This would require geocoding the location string to coordinates
      // For now, we'll skip location filtering in this basic implementation
    }

    const professionals = await Professional.find(query)
      .populate('user', 'name email phone')
      .populate('services', 'name category basePrice')
      .sort({ rating: -1, reviewCount: -1 });

    res.json({ professionals });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get professional by ID
router.get('/:id', async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('services', 'name category description basePrice priceUnit');

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    // Get reviews for this professional
    const reviews = await Review.find({ professional: req.params.id })
      .populate('reviewer', 'name')
      .populate('booking', 'service date')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ professional, reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create professional profile (for authenticated users)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user already has a professional profile
    const existingProfile = await Professional.findOne({ user: req.user._id });
    if (existingProfile) {
      return res.status(400).json({ message: 'Professional profile already exists' });
    }

    const professionalData = {
      ...req.body,
      user: req.user._id,
    };

    const professional = new Professional(professionalData);
    await professional.save();

    // Update user role to professional
    await User.findByIdAndUpdate(req.user._id, { role: 'professional' });

    await professional.populate('user', 'name email');
    await professional.populate('services', 'name category');

    res.status(201).json({
      message: 'Professional profile created successfully',
      professional,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update professional profile
router.put('/:id', auth, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    // Only allow the professional to update their own profile
    if (professional.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedProfessional = await Professional.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).populate('user', 'name email').populate('services', 'name category');

    res.json({
      message: 'Professional profile updated successfully',
      professional: updatedProfessional,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user's professional profile
router.get('/profile/me', auth, async (req, res) => {
  try {
    const professional = await Professional.findOne({ user: req.user._id })
      .populate('user', 'name email phone')
      .populate('services', 'name category description basePrice');

    if (!professional) {
      return res.status(404).json({ message: 'Professional profile not found' });
    }

    res.json({ professional });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update availability
router.put('/:id/availability', auth, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    if (professional.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    professional.availability = req.body.availability;
    professional.updatedAt = Date.now();
    await professional.save();

    res.json({
      message: 'Availability updated successfully',
      availability: professional.availability,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Update verification status
router.put('/:id/verification', auth, async (req, res) => {
  try {
    // Check if user is admin (you might want to add an admin role)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { verificationStatus } = req.body;
    const professional = await Professional.findByIdAndUpdate(
      req.params.id,
      { verificationStatus },
      { new: true }
    ).populate('user', 'name email');

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    res.json({
      message: 'Verification status updated successfully',
      professional,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
