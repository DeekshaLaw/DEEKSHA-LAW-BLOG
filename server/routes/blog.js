const express = require('express');
const {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  updateBlogStatus,
  addComment,
  likeBlog,
  getUserBlogs
} = require('../controllers/blog');
const { protect, authorize } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

const router = express.Router();

// Public/Private routes
// For public access but with auth info if available
router.get('/', (req, res, next) => {
  // Continue even if not logged in
  if (!req.headers.authorization) {
    return next();
  }
  
  // Try to authenticate but continue either way
  protect(req, res, (err) => {
    if (err) {
      console.error('Auth error but continuing:', err);
    }
    next();
  });
}, getBlogs);

router.get('/:id', getBlog);

// Protected routes
router.use(protect);

// User routes
router.post('/', uploadMiddleware, createBlog);
router.put('/:id', uploadMiddleware, updateBlog);
router.delete('/:id', deleteBlog);
router.post('/:id/comments', addComment);
router.put('/:id/like', likeBlog);
router.get('/user/:status', getUserBlogs);

// Admin only routes
router.put('/:id/status', authorize('admin'), updateBlogStatus);

module.exports = router; 