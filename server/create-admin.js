const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// MongoDB connection
const MONGO_URI = "mongodb+srv://harsharsm007:6UWJEOyssPqbuzyx@deekshalawblog.axpqkdx.mongodb.net/?retryWrites=true&w=majority&appName=DEEKSHALAWBLOG";

// Admin credentials
const adminData = {
  name: 'Admin',
  email: 'admin@deekshalaw.in',
  password: 'CobaltZen@66',
  role: 'admin',
  isVerified: true
};

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: adminData.email });
      
      if (existingAdmin) {
        console.log('Admin user already exists');
      } else {
        // Create new admin user
        const admin = await User.create(adminData);
        console.log('Admin user created successfully:', admin.email);
      }
      
      // Disconnect from MongoDB
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error creating admin user:', error.message);
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  }); 