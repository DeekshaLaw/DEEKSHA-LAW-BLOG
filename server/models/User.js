const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetAttempts: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function() {
  const secret = process.env.JWT_SECRET || "deeksha_law_secret_key";
  const expire = process.env.JWT_EXPIRE || "30d";
  
  return jwt.sign(
    { id: this._id, role: this.role },
    secret,
    { expiresIn: expire }
  );
};

// Generate verification token
UserSchema.methods.getVerificationToken = function() {
  // Generate a 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash token and set to verificationToken field
  this.verificationToken = otp;
  
  // Set expire (10 minutes)
  this.verificationTokenExpire = Date.now() + 10 * 60 * 1000;
  
  return otp;
};

// Generate reset password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate a 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store the OTP in the resetPasswordToken field
  this.resetPasswordToken = otp;
  
  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return otp;
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 