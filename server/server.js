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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('DEEKSHA LAW API is running');
});

// Connect to MongoDB
const MONGO_URI = "mongodb+srv://harsharsm007:6UWJEOyssPqbuzyx@deekshalawblog.axpqkdx.mongodb.net/?retryWrites=true&w=majority&appName=DEEKSHALAWBLOG";
const PORT = process.env.PORT || 5000;

console.log("MongoDB URI:", MONGO_URI);

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
