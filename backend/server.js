const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fixnow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../build')));

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Default route
app.get('/', (req, res) => {
  res.send('FixNow Backend API');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
