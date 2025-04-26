const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token from Bearer
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    const error = new Error('Not authorized to access this route');
    error.statusCode = 401;
    return next ? next(error) : res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }

  try {
    // Verify token
    const secret = process.env.JWT_SECRET || "deeksha_law_secret_key";
    const decoded = jwt.verify(token, secret);

    // Find user by id
    const user = await User.findById(decoded.id);

    if (!user) {
      const error = new Error('No user found with this id');
      error.statusCode = 404;
      return next ? next(error) : res.status(404).json({ 
        success: false, 
        message: 'No user found with this id' 
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      const error = new Error('Please verify your email first');
      error.statusCode = 401;
      return next ? next(error) : res.status(401).json({ 
        success: false, 
        message: 'Please verify your email first' 
      });
    }

    // Add user to request object
    req.user = user;
    return next();
  } catch (err) {
    const error = new Error('Not authorized to access this route');
    error.statusCode = 401;
    error.originalError = err;
    return next ? next(error) : res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
}; 