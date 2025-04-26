const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password
    });
    
    // Generate verification token
    const verificationToken = user.getVerificationToken();
    
    // Save user with token
    await user.save();
    
    // Create verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
    
    const message = `
      <h1>Welcome to Deeksha Law</h1>
      <p>Thank you for signing up with us.</p>
      <p>Please use the following One-Time Password (OTP) to verify your email address:</p>
      <h2>${verificationToken}</h2>
      <p>This OTP is valid for 10 minutes.</p>
      <br/>
      <p>Regards,<br/>Team Deeksha Law</p>
    `;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Email Verification',
        html: message
      });
      
      res.status(200).json({
        success: true,
        message: 'OTP sent to email'
      });
    } catch (err) {
      user.verificationToken = undefined;
      user.verificationTokenExpire = undefined;
      
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Verify user email with OTP
// @route   POST /api/auth/verify
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Find user with matching token and not expired
    const user = await User.findOne({
      email,
      verificationToken: otp,
      verificationTokenExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Set user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    
    await user.save();
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }
    
    // Generate new verification token
    const verificationToken = user.getVerificationToken();
    
    await user.save();
    
    const message = `
      <h1>Email Verification</h1>
      <p>Please use the following OTP to verify your email:</p>
      <h2>${verificationToken}</h2>
      <p>OTP is valid for 10 minutes.</p>
    `;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Email Verification',
        html: message
      });
      
      res.status(200).json({
        success: true,
        message: 'OTP sent to email'
      });
    } catch (err) {
      user.verificationToken = undefined;
      user.verificationTokenExpire = undefined;
      
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }
    
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first'
      });
    }
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Check if user is an admin
// @route   POST /api/auth/check-admin
// @access  Public
exports.checkAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        isAdmin: false,
        message: 'User not found'
      });
    }

    // Check if user is an admin
    const isAdmin = user.role === 'admin';

    res.status(200).json({
      success: true,
      isAdmin
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      isAdmin: false,
      message: 'Server error'
    });
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
}; 