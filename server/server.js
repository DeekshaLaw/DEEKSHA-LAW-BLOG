const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Set essential environment variables if not loaded from .env
process.env.JWT_SECRET = process.env.JWT_SECRET || "deeksha_law_secret_key";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "30d";

// Import routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const categoryRoutes = require('./routes/category');
const userRoutes = require('./routes/user');

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'https://deeksha-law-blog-d09x.onrender.com',
    'https://deeksha-law-blog.onrender.com',
    'https://deekshalaw.in',
    'https://www.deekshalaw.in'
    'deekshalaw.in'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
} else {
  // Default route for development
  app.get('/', (req, res) => {
    res.send('DEEKSHA LAW API is running');
  });
}

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://deekshalaw314:hkdA7jShyPx7Dspv@deeksha-law.dl65cnb.mongodb.net/?retryWrites=true&w=majority&appName=deeksha-law";
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });
