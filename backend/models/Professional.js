const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  businessName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],
  experience: {
    type: Number, // years of experience
    required: true,
  },
  certifications: [{
    name: String,
    issuer: String,
    dateObtained: Date,
    expiryDate: Date,
  }],
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
  },
  availability: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean },
  },
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
  },
  radius: {
    type: Number, // service radius in miles
    default: 25,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  hourlyRate: {
    type: Number,
    required: true,
  },
  profileImage: {
    type: String, // URL to profile image
  },
  portfolioImages: [{
    type: String, // URLs to portfolio images
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  isActive: {
    type: Boolean,
    default: true,
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
professionalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for location-based queries
professionalSchema.index({ 'location.coordinates': '2dsphere' });
professionalSchema.index({ services: 1 });
professionalSchema.index({ rating: -1 });
professionalSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('Professional', professionalSchema);
