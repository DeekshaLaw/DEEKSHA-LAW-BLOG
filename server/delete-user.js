const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import User model
const User = require('./models/User');

// Email of the user to delete
const emailToDelete = 'rsmharsha14@gmail.com'; // Replace with the email you want to delete

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find and delete the user
      const result = await User.deleteOne({ email: emailToDelete });
      
      if (result.deletedCount === 1) {
        console.log(`User with email ${emailToDelete} successfully deleted`);
      } else {
        console.log(`User with email ${emailToDelete} not found`);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      // Close the connection
      mongoose.connection.close();
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  }); 