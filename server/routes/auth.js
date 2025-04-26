const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
  resendVerification,
  checkAdmin
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/register', register);
router.post('/verify', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/check-admin', checkAdmin);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router; 