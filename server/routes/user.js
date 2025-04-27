const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateProfile,
  getUserLikes,
  getUserComments,
  deleteUserComment,
  getCurrentUser,
  getUserLikesById,
  getUserCommentsById,
  deleteUserLikeById,
  deleteUserCommentById
} = require('../controllers/user');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protected user routes
router.use(protect);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);
router.get('/activity/likes', getUserLikes);
router.get('/activity/comments', getUserComments);
router.delete('/activity/comments/:blogId/:commentId', deleteUserComment);

// Admin only routes
router.use(authorize('admin'));
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/:id/activity/likes', getUserLikesById);
router.get('/:id/activity/comments', getUserCommentsById);
router.delete('/:userId/activity/likes/:blogId', deleteUserLikeById);
router.delete('/:userId/activity/comments/:blogId/:commentId', deleteUserCommentById);

module.exports = router; 