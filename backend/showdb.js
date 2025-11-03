const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Professional = require('./models/Professional');
const Service = require('./models/Service');
const Review = require('./models/Review');
const Notification = require('./models/Notification');

async function showDatabaseData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fixnow', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB\n');

    // Show Users
    console.log('=== USERS ===');
    const users = await User.find().select('-password');
    if (users.length === 0) {
      console.log('No users found');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
        console.log(`   Phone: ${user.phone || 'N/A'}, Address: ${user.address || 'N/A'}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}\n`);
      });
    }

    // Show Bookings
    console.log('=== BOOKINGS ===');
    const bookings = await Booking.find().populate('user', 'name email');
    if (bookings.length === 0) {
      console.log('No bookings found');
    } else {
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. Service: ${booking.service}`);
        console.log(`   User: ${booking.user?.name || 'Unknown'} (${booking.user?.email || 'N/A'})`);
        console.log(`   Date: ${booking.date.toLocaleDateString()}, Time: ${booking.time}`);
        console.log(`   Location: ${booking.location}`);
        console.log(`   Status: ${booking.status}, Payment Status: ${booking.paymentStatus}`);
        console.log(`   Notes: ${booking.notes || 'None'}`);
        console.log(`   Created: ${booking.createdAt.toLocaleDateString()}\n`);
      });
    }

    // Show Payments
    console.log('=== PAYMENTS ===');
    const payments = await Payment.find().populate('user', 'name email').populate('booking', 'service date');
    if (payments.length === 0) {
      console.log('No payments found');
    } else {
      payments.forEach((payment, index) => {
        console.log(`${index + 1}. Amount: $${payment.amount}`);
        console.log(`   User: ${payment.user?.name || 'Unknown'} (${payment.user?.email || 'N/A'})`);
        console.log(`   Booking: ${payment.booking?.service || 'N/A'} on ${payment.booking?.date?.toLocaleDateString() || 'N/A'}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Stripe ID: ${payment.stripePaymentIntentId}`);
        console.log(`   Created: ${payment.createdAt.toLocaleDateString()}\n`);
      });
    }

    // Show Professionals
    console.log('=== PROFESSIONALS ===');
    const professionals = await Professional.find().populate('user', 'name email');
    if (professionals.length === 0) {
      console.log('No professionals found');
    } else {
      professionals.forEach((prof, index) => {
        console.log(`${index + 1}. ${prof.user?.name || 'Unknown'} (${prof.user?.email || 'N/A'})`);
        console.log(`   Verification: ${prof.verificationStatus}`);
        console.log(`   Rating: ${prof.rating || 'N/A'}, Reviews: ${prof.reviewCount || 0}`);
        console.log(`   Services: ${prof.services?.join(', ') || 'None'}`);
        console.log(`   Active: ${prof.isActive}`);
        console.log(`   Created: ${prof.createdAt.toLocaleDateString()}\n`);
      });
    }

    // Show Services
    console.log('=== SERVICES ===');
    const services = await Service.find();
    if (services.length === 0) {
      console.log('No services found');
    } else {
      services.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name} (${service.category})`);
        console.log(`   Description: ${service.description || 'N/A'}`);
        console.log(`   Base Price: $${service.basePrice || 'N/A'} ${service.priceUnit || ''}`);
        console.log(`   Active: ${service.isActive}`);
        console.log(`   Created: ${service.createdAt.toLocaleDateString()}\n`);
      });
    }

    // Show Reviews
    console.log('=== REVIEWS ===');
    const reviews = await Review.find().populate('reviewer', 'name').populate('professional', 'user').populate('booking', 'service');
    if (reviews.length === 0) {
      console.log('No reviews found');
    } else {
      reviews.forEach((review, index) => {
        console.log(`${index + 1}. Rating: ${review.rating}/5`);
        console.log(`   Reviewer: ${review.reviewer?.name || 'Unknown'}`);
        console.log(`   Service: ${review.booking?.service || 'N/A'}`);
        console.log(`   Comment: ${review.comment || 'No comment'}`);
        console.log(`   Verified: ${review.isVerified}`);
        console.log(`   Created: ${review.createdAt.toLocaleDateString()}\n`);
      });
    }

    // Show Notifications
    console.log('=== NOTIFICATIONS ===');
    const notifications = await Notification.find().populate('user', 'name email').limit(10);
    if (notifications.length === 0) {
      console.log('No notifications found');
    } else {
      notifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title}`);
        console.log(`   User: ${notif.user?.name || 'Unknown'} (${notif.user?.email || 'N/A'})`);
        console.log(`   Type: ${notif.type}, Priority: ${notif.priority}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Read: ${notif.isRead}`);
        console.log(`   Created: ${notif.createdAt.toLocaleDateString()}\n`);
      });
    }

    // Summary
    console.log('=== SUMMARY ===');
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Bookings: ${bookings.length}`);
    console.log(`Total Payments: ${payments.length}`);
    console.log(`Total Professionals: ${professionals.length}`);
    console.log(`Total Services: ${services.length}`);
    console.log(`Total Reviews: ${reviews.length}`);
    console.log(`Total Notifications: ${await Notification.countDocuments()}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
showDatabaseData();
