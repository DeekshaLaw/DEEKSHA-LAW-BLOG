const Blog = require('../models/Blog');
const Category = require('../models/Category');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Helper function to check if a URL is from Cloudinary
const isCloudinaryUrl = (url) => {
  return url && (url.includes('cloudinary.com') || url.startsWith('http'));
};

// Helper function to delete old image if it's a local file
const deleteLocalImage = (imagePath) => {
  if (imagePath && !isCloudinaryUrl(imagePath)) {
    const fullPath = path.join(__dirname, '..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

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
      blog.status = 'approved';
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
    let query = {};
    
    // If not logged in or not admin, only show approved blogs
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'approved';
    } else {
      // For admin users, if status filter is provided and not empty, use it
      if (req.query.status) {
        query.status = req.query.status;
      } else if (req.query.status === '') {
        // Empty string means "All Statuses" was selected - don't filter by status
      } else {
        // If status parameter is not present (default case), show approved blogs
        query.status = 'approved';
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
    
    // Get blogs with populated author and category
    const blogs = await Blog.find(query)
      .populate('category', 'name')
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    // Filter out blogs where author is null (deleted)
    const validBlogs = blogs.filter(blog => blog.author !== null);
    
    res.status(200).json({
      success: true,
      count: validBlogs.length,
      data: validBlogs
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
    console.log('Get blog request received for id:', req.params.id);
    console.log('User data:', req.user ? {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    } : 'Not authenticated');
    console.log('Query parameters:', req.query);
    
    const blog = await Blog.findById(req.params.id)
      .populate('category', 'name')
      .populate('author', 'name')
      .populate('comments.user', 'name');
    
    if (!blog) {
      console.log('Blog not found');
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    console.log('Blog found. Status:', blog.status);
    
    // Admin preview check (more robust version)
    let isAdminPreview = false;
    
    // Check for admin preview query parameter and admin user
    if (req.query.admin_preview === 'true') {
      if (req.user && req.user.role === 'admin') {
        console.log('✅ Valid admin preview mode detected');
        isAdminPreview = true;
      } else {
        console.log('❌ Admin preview requested but user is not admin');
      }
    }
    
    // Authorization check
    const isAdmin = req.user && req.user.role === 'admin';
    const isAuthor = req.user && blog.author._id.toString() === req.user.id;
    const isApproved = blog.status === 'approved';
    
    console.log('Auth checks:', { isAdmin, isAuthor, isApproved, isAdminPreview });
    
    // Skip the status check if admin is previewing or other authorized access
    if (!isApproved && !isAdmin && !isAuthor && !isAdminPreview) {
      console.log('Access denied: User not authorized');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this blog'
      });
    }
    
    console.log('Access granted, sending blog data');
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (err) {
    console.error('Error in getBlog:', err);
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
      if (!req.body.status) {
        req.body.status = 'approved';
      }
      console.log(`Admin updating blog - setting status to ${req.body.status}`);
    } else {
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
      // If there was an old image, delete it if it's a local file
      if (blog.featuredImage) {
        deleteLocalImage(blog.featuredImage);
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
      // If it's a local file, delete it
      deleteLocalImage(blog.featuredImage);
      
      // If it's a Cloudinary image, delete it from Cloudinary
      if (isCloudinaryUrl(blog.featuredImage)) {
        const publicId = blog.featuredImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`blog-featured-images/${publicId}`);
      }
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    
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
    
    // Populate the user data before sending response
    const updatedBlog = await Blog.findById(req.params.id)
      .populate('comments.user', 'name');
    
    res.status(200).json({
      success: true,
      data: updatedBlog.comments
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