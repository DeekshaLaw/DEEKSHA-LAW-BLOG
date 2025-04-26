const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateProfile
} = require('../controllers/user');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protected user routes
router.use(protect);
router.put('/profile', updateProfile);

// Admin only routes
router.use(authorize('admin'));
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router; 