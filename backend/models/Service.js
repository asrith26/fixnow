const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['plumbing', 'electrical', 'hvac', 'carpentry', 'painting', 'cleaning', 'landscaping', 'roofing', 'appliance_repair', 'other'],
  },
  description: {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
  },
  priceUnit: {
    type: String,
    enum: ['hour', 'job', 'square_foot', 'linear_foot'],
    default: 'hour',
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true,
  },
  materialsIncluded: {
    type: Boolean,
    default: false,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
  },
  requiredCertifications: [{
    type: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  icon: {
    type: String, // URL to service icon
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for category and active services
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ name: 1 });

module.exports = mongoose.model('Service', serviceSchema);
