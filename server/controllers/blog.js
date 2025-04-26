const Blog = require('../models/Blog');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');

// @desc    Create a new blog
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    // Check if category exists
    const categoryExists = await Category.findById(category);
    
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Create blog with properties from request
    const blog = new Blog({
      title,
      content,
      category,
      author: req.user.id,
      featuredImage: req.featuredImage || null
    });
    
    // If admin is creating, auto-approve
    if (req.user.role === 'admin') {
      console.log('Admin creating blog - setting to approved status');
      blog.isAdmin = true;
      blog.status = 'approved'; // Explicitly set status to approved for admin
    }
    
    // Save the blog
    await blog.save();
    
    console.log(`Blog created with status: ${blog.status}`);
    
    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (err) {
    console.error('Error in createBlog:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get all blogs (filtered by status for non-admins)
// @route   GET /api/blogs
// @access  Public/Private
exports.getBlogs = async (req, res) => {
  try {
    console.log('getBlogs request from:', req.user ? `User ${req.user.name} (${req.user.role})` : 'Unauthenticated user');
    console.log('Query parameters:', req.query);
    
    let query = {};
    
    // If not logged in or not admin, only show approved blogs
    if (!req.user || req.user.role !== 'admin') {
      console.log('Restricting to approved blogs only');
      query.status = 'approved';
    } else {
      console.log('Admin user, showing all blogs or filtering by status');
      // For admin users, if no status filter provided, show all blogs including pending ones
      // Only apply status filter if explicitly provided in query params
      if (req.query.status) {
        console.log(`Admin filtered by status: ${req.query.status}`);
        query.status = req.query.status;
      }
    }
    
    // Allow filtering by category for everyone
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Allow filtering by user for admin
    if (req.user && req.user.role === 'admin' && req.query.author) {
      query.author = req.query.author;
    }
    
    console.log('Final query:', query);
    
    // Get blogs
    const blogs = await Blog.find(query)
      .populate('category', 'name')
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${blogs.length} blogs matching criteria`);
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (err) {
    console.error('Error in getBlogs:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public/Private
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('category', 'name')
      .populate('author', 'name')
      .populate('comments.user', 'name');
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if blog is approved or if user is owner or admin
    if (
      blog.status !== 'approved' && 
      (!req.user || 
        (req.user.role !== 'admin' && 
         blog.author._id.toString() !== req.user.id)
      )
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this blog'
      });
    }
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user is blog owner or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }
    
    // Handle status based on user role
    if (req.user.role === 'admin') {
      // Admin can set any status, but if no status is provided, keep it as approved
      if (!req.body.status) {
        req.body.status = 'approved';
      }
      console.log(`Admin updating blog - setting status to ${req.body.status}`);
    } else {
      // If regular user updates, reset status to pending
      req.body.status = 'pending';
      console.log('Regular user updating blog - resetting to pending status');
    }
    
    // Check if category exists if provided
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }
    
    // Handle image update
    let featuredImage = blog.featuredImage;
    
    if (req.featuredImage) {
      // If there was an old image, delete it
      if (blog.featuredImage) {
        const oldImagePath = path.join(__dirname, '..', blog.featuredImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      featuredImage = req.featuredImage;
    }
    
    // Update blog
    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        featuredImage 
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    console.log(`Blog updated with status: ${blog.status}`);
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (err) {
    console.error('Error in updateBlog:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user is blog owner or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }
    
    // Delete image if exists
    if (blog.featuredImage) {
      const imagePath = path.join(__dirname, '..', blog.featuredImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await blog.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update blog status (approve/reject)
// @route   PUT /api/blogs/:id/status
// @access  Private/Admin
exports.updateBlogStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status'
      });
    }
    
    let blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Update blog status
    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Add comment to blog
// @route   POST /api/blogs/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a comment'
      });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if blog is approved or if user is admin
    if (blog.status !== 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Blog must be approved to add comments'
      });
    }
    
    // Add comment
    const newComment = {
      user: req.user.id,
      name: req.user.name,
      comment
    };
    
    blog.comments.unshift(newComment);
    
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog.comments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Like a blog
// @route   PUT /api/blogs/:id/like
// @access  Private
exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if blog is approved or if user is admin
    if (blog.status !== 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Blog must be approved to like'
      });
    }
    
    // Check if blog has already been liked by user
    if (blog.likes.some(like => like.user.toString() === req.user.id)) {
      // Remove like
      blog.likes = blog.likes.filter(
        like => like.user.toString() !== req.user.id
      );
    } else {
      // Add like
      blog.likes.unshift({ user: req.user.id });
    }
    
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog.likes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get user blogs (by status)
// @route   GET /api/blogs/user/:status
// @access  Private
exports.getUserBlogs = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['all', 'pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status parameter'
      });
    }
    
    let query = { author: req.user.id };
    
    if (status !== 'all') {
      query.status = status;
    }
    
    const blogs = await Blog.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}; 