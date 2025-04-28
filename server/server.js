const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { securityHeaders, limiter, corsOptions } = require('./middleware/security');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Ensure JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Set essential environment variables if not loaded from .env
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "30d";
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Import routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const categoryRoutes = require('./routes/category');
const userRoutes = require('./routes/user');

// Create Express app
const app = express();

// CORS middleware (must be before other middleware)
app.use(cors(corsOptions));

// Security middleware
app.use(securityHeaders);
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, 'public')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
} else {
  // In development, just show a simple message
  app.get('/', (req, res) => {
    res.send('DEEKSHA LAW API is running in development mode');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

console.log("MongoDB URI:", MONGO_URI);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });
