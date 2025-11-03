const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Professional = require('../models/Professional');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProfessionals,
      totalBookings,
      totalRevenue,
      pendingBookings,
      activeProfessionals,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Professional.countDocuments({ verificationStatus: 'verified' }),
      Booking.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Booking.countDocuments({ status: 'pending' }),
      Professional.countDocuments({ verificationStatus: 'verified', isActive: true }),
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    res.json({
      stats: {
        totalUsers,
        totalProfessionals,
        totalBookings,
        totalRevenue: revenue,
        pendingBookings,
        activeProfessionals,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'professional', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bookings with filters
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, service, dateFrom, dateTo } = req.query;

    let query = {};
    if (status) query.status = status;
    if (service) query.service = { $regex: service, $options: 'i' };
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment analytics
router.get('/payments/analytics', async (req, res) => {
  try {
    const { period = 'month' } = req.query; // 'week', 'month', 'year'

    let groupBy;
    switch (period) {
      case 'week':
        groupBy = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
        break;
      case 'month':
        groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'year':
        groupBy = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      default:
        groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const analytics = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      {
        $group: {
          _id: groupBy,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manage professional verifications
router.get('/professionals/verification', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const professionals = await Professional.find({ verificationStatus: status })
      .populate('user', 'name email phone')
      .populate('services', 'name category')
      .sort({ createdAt: -1 });

    res.json({ professionals });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update professional verification
router.put('/professionals/:id/verification', async (req, res) => {
  try {
    const { verificationStatus, notes } = req.body;

    const professional = await Professional.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus,
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate('user', 'name email');

    if (!professional) {
      return res.status(404).json({ message: 'Professional not found' });
    }

    // Create notification for the professional
    const notification = new Notification({
      user: professional.user._id,
      type: verificationStatus === 'verified' ? 'system_message' : 'system_message',
      title: `Profile ${verificationStatus}`,
      message: verificationStatus === 'verified'
        ? 'Congratulations! Your professional profile has been verified and is now live.'
        : `Your profile verification was ${verificationStatus}. ${notes || ''}`,
      priority: 'high',
    });

    await notification.save();

    res.json({
      message: 'Professional verification updated successfully',
      professional,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get system reports
router.get('/reports', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let reportData;

    switch (type) {
      case 'bookings':
        reportData = await Booking.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              byStatus: {
                $push: '$status'
              }
            }
          },
          { $sort: { '_id': 1 } }
        ]);
        break;

      case 'revenue':
        reportData = await Payment.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end }, status: 'succeeded' } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ]);
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      report: {
        type,
        startDate: start,
        endDate: end,
        data: reportData,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
