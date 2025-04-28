const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

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
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if OTP is expired
    if (user.verificationTokenExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }
    
    // Hash the input OTP to compare with stored hash
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    
    // Compare hashed OTP with stored hash
    if (hashedOTP !== user.verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
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

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find the user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    // Generate reset token (OTP)
    const resetToken = user.getResetPasswordToken();
    
    // Reset attempts counter when requesting a new OTP
    user.resetAttempts = 0;
    
    await user.save();
    
    // Create reset password email
    const message = `
      <h1>Password Reset Request</h1>
      <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
      <p>Please use the following One-Time Password (OTP) to reset your password:</p>
      <h2>${resetToken}</h2>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <br/>
      <p>Regards,<br/>Team Deeksha Law</p>
    `;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset',
        html: message
      });
      
      res.status(200).json({
        success: true,
        message: 'OTP sent to email'
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.resetAttempts = undefined;
      
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

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    
    // Validate required fields
    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, otp, and password are required'
      });
    }
    
    // Find the user by email first
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    // Check if any reset password token exists
    if (!user.resetPasswordToken || !user.resetPasswordExpire) {
      return res.status(400).json({
        success: false,
        message: 'Password reset not requested or token expired'
      });
    }
    
    // Check if token has expired
    if (user.resetPasswordExpire < Date.now()) {
      // Clear expired token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.resetAttempts = undefined;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one'
      });
    }
    
    // Check if OTP matches - using strict comparison
    if (user.resetPasswordToken !== otp) {
      // Track failed attempts (create or increment the counter)
      if (!user.resetAttempts) {
        user.resetAttempts = 1;
      } else {
        user.resetAttempts += 1;
      }
      
      // If too many attempts, invalidate the token
      if (user.resetAttempts >= 3) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.resetAttempts = undefined;
        await user.save();
        
        return res.status(400).json({
          success: false,
          message: 'Too many failed attempts. Please request a new OTP'
        });
      }
      
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again',
        attemptsLeft: 3 - user.resetAttempts
      });
    }
    
    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Set new password
    user.password = password;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetAttempts = undefined;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// @desc    Verify reset password OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email and otp are required'
      });
    }
    
    // Find the user by email first
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    // Check if any reset password token exists
    if (!user.resetPasswordToken || !user.resetPasswordExpire) {
      return res.status(400).json({
        success: false,
        message: 'Password reset not requested or token expired'
      });
    }
    
    // Check if token has expired
    if (user.resetPasswordExpire < Date.now()) {
      // Clear expired token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.resetAttempts = undefined;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one'
      });
    }
    
    // Check if OTP matches - using strict comparison
    if (user.resetPasswordToken !== otp) {
      // Track failed attempts (create or increment the counter)
      if (!user.resetAttempts) {
        user.resetAttempts = 1;
      } else {
        user.resetAttempts += 1;
      }
      
      // If too many attempts, invalidate the token
      if (user.resetAttempts >= 3) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.resetAttempts = undefined;
        await user.save();
        
        return res.status(400).json({
          success: false,
          message: 'Too many failed attempts. Please request a new OTP'
        });
      }
      
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again',
        attemptsLeft: 3 - user.resetAttempts
      });
    }
    
    // Reset the attempts counter on successful verification
    user.resetAttempts = 0;
    await user.save();
    
    // OTP is valid
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
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