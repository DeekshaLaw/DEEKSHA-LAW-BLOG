const User = require('../models/User');
const Blog = require('../models/Blog');
const mongoose = require('mongoose');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');
    
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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.remove();
    
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Find user
    let user = await User.findById(req.user.id);
    
    // Update profile
    user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');
    
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

// @desc    Get user liked blogs
// @route   GET /api/users/activity/likes
// @access  Private
exports.getUserLikes = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in request'
      });
    }
    
    // Get all blogs for testing - we'll filter them in code
    const allBlogs = await Blog.find({ status: 'approved' })
      .select('_id title createdAt featuredImage category likes')
      .populate('category', 'name');

    console.log('All approved blogs:', allBlogs.length);
    
    // Debug each blog to check likes
    const debugResults = [];
    const matchedBlogs = [];
    
    allBlogs.forEach(blog => {
      const blogDebug = {
        blogId: blog._id,
        title: blog.title,
        hasLikes: Boolean(blog.likes),
        likesIsArray: Array.isArray(blog.likes),
        likesCount: blog.likes ? blog.likes.length : 0
      };
      
      if (blog.likes && blog.likes.length > 0) {
        // Check each like for a match with this user
        blogDebug.likeDetails = [];
        
        blog.likes.forEach(like => {
          if (!like || !like.user) {
            blogDebug.likeDetails.push('Invalid like object');
            return;
          }
          
          const likeUserId = String(like.user);
          const currentUserId = String(req.user.id);
          
          blogDebug.likeDetails.push({
            likeUserId,
            currentUserId,
            isMatch: likeUserId === currentUserId
          });
          
          // If this is a match, add the blog to results
          if (likeUserId === currentUserId) {
            // Create a plain object without the likes array to avoid any issues
            matchedBlogs.push({
              _id: blog._id,
              title: blog.title,
              createdAt: blog.createdAt,
              featuredImage: blog.featuredImage,
              category: blog.category
            });
          }
        });
      }
      
      debugResults.push(blogDebug);
    });
    
    // Log the full debug results
    console.log('DEBUG: Raw likes data:', JSON.stringify(debugResults));
    console.log(`Found ${matchedBlogs.length} blogs liked by user ID ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      count: matchedBlogs.length,
      data: matchedBlogs,
      debug: {
        userIdStr: String(req.user.id),
        totalBlogsChecked: allBlogs.length,
        blogsWithLikes: debugResults.filter(b => b.likesCount > 0).length,
        debugData: debugResults
      }
    });
  } catch (err) {
    console.error('Error in getUserLikes:', err);
    
    // Send a 200 response with empty data
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: 'Could not retrieve liked blogs due to a server error: ' + err.message
    });
  }
};

// @desc    Get user comments
// @route   GET /api/users/activity/comments
// @access  Private
exports.getUserComments = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in request'
      });
    }
    
    console.log('Fetching comments for user ID:', req.user.id);
    
    // Find all approved blogs where the user has commented
    const blogs = await Blog.find({ 
      status: 'approved',
      'comments.user': req.user.id  // Mongoose automatically handles ObjectId conversion
    })
    .select('_id title createdAt comments');
    
    console.log(`Found ${blogs.length} blogs with user comments`);
    
    // Process the blogs to extract only the user's comments
    const userComments = [];
    
    for (const blog of blogs) {
      // Filter to get only this user's comments
      const filteredComments = blog.comments.filter(comment => 
        comment && comment.user && String(comment.user) === String(req.user.id)
      );
      
      if (filteredComments.length > 0) {
        userComments.push({
          blogId: blog._id,
          blogTitle: blog.title,
          comments: filteredComments
        });
        
        console.log(`Found ${filteredComments.length} comments in blog: ${blog.title}`);
      }
    }
    
    console.log(`Found comments in ${userComments.length} blogs`);
    
    res.status(200).json({
      success: true,
      count: userComments.length,
      data: userComments
    });
  } catch (err) {
    console.error('Error in getUserComments:', err);
    
    // Return 200 with empty data instead of error
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: 'Could not retrieve user comments due to a server error: ' + err.message
    });
  }
};

// @desc    Delete user comment
// @route   DELETE /api/users/activity/comments/:blogId/:commentId
// @access  Private
exports.deleteUserComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    
    console.log('Blog ID:', blogId);
    console.log('Comment ID:', commentId);
    console.log('User ID:', req.user.id);
    
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if comment exists and belongs to user
    const commentIndex = blog.comments.findIndex(
      comment => comment._id.toString() === commentId && comment.user.toString() === req.user.id
    );
    
    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or not authorized to delete'
      });
    }
    
    // Remove the comment
    blog.comments.splice(commentIndex, 1);
    await blog.save();
    
    console.log(`Deleted comment ${commentId} from blog ${blogId}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Error in deleteUserComment:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment: ' + err.message
    });
  }
};

// @desc    Get current user info (diagnostic)
// @route   GET /api/users/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    console.log('Getting current user info');
    console.log('User ID from token:', req.user.id);
    console.log('User role:', req.user.role);
    
    // Get the user from database to confirm it exists
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }
    
    // Return user info for diagnostic purposes
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user info: ' + err.message
    });
  }
};

// @desc    Get user liked blogs by ID (for admin)
// @route   GET /api/users/:id/activity/likes
// @access  Private/Admin
exports.getUserLikesById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get all blogs for testing - we'll filter them in code
    const allBlogs = await Blog.find({ status: 'approved' })
      .select('_id title createdAt featuredImage category likes')
      .populate('category', 'name');
    
    // Filter blogs that this user has liked
    const matchedBlogs = [];
    
    allBlogs.forEach(blog => {
      if (blog.likes && blog.likes.length > 0) {
        // Check each like for a match with this user
        blog.likes.forEach(like => {
          if (like && like.user) {
            const likeUserId = String(like.user);
            const targetUserId = String(userId);
            
            // If this is a match, add the blog to results
            if (likeUserId === targetUserId) {
              // Create a plain object without the likes array to avoid any issues
              matchedBlogs.push({
                _id: blog._id,
                title: blog.title,
                createdAt: blog.createdAt,
                featuredImage: blog.featuredImage,
                category: blog.category
              });
            }
          }
        });
      }
    });
    
    res.status(200).json({
      success: true,
      count: matchedBlogs.length,
      data: matchedBlogs
    });
  } catch (err) {
    console.error('Error in getUserLikesById:', err);
    
    // Send a 200 response with empty data
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: 'Could not retrieve liked blogs due to a server error: ' + err.message
    });
  }
};

// @desc    Get user comments by ID (for admin)
// @route   GET /api/users/:id/activity/comments
// @access  Private/Admin
exports.getUserCommentsById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log('Fetching comments for user ID:', userId);
    
    // Find all approved blogs (don't filter by comments.user in the query as it's unreliable)
    const blogs = await Blog.find({ status: 'approved' })
      .select('_id title createdAt comments');
    
    console.log(`Found ${blogs.length} approved blogs to check for comments`);
    
    // Process the blogs to extract only the user's comments
    const userComments = [];
    
    for (const blog of blogs) {
      // Skip blogs with no comments
      if (!blog.comments || blog.comments.length === 0) {
        continue;
      }
      
      // Filter to get only this user's comments
      const filteredComments = blog.comments.filter(comment => {
        const commentUserId = comment && comment.user ? String(comment.user) : null;
        const targetUserId = String(userId);
        const isMatch = commentUserId === targetUserId;
        
        if (isMatch) {
          console.log(`Found matching comment in blog: ${blog.title}`);
        }
        
        return isMatch;
      });
      
      if (filteredComments.length > 0) {
        userComments.push({
          blogId: blog._id,
          blogTitle: blog.title,
          comments: filteredComments
        });
        
        console.log(`Added ${filteredComments.length} comments from blog: ${blog.title}`);
      }
    }
    
    console.log(`Total blogs with user comments: ${userComments.length}`);
    
    res.status(200).json({
      success: true,
      count: userComments.length,
      data: userComments
    });
  } catch (err) {
    console.error('Error in getUserCommentsById:', err);
    
    // Return 200 with empty data instead of error
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: 'Could not retrieve user comments due to a server error: ' + err.message
    });
  }
};

// @desc    Delete user like by ID (for admin)
// @route   DELETE /api/users/:userId/activity/likes/:blogId
// @access  Private/Admin
exports.deleteUserLikeById = async (req, res) => {
  try {
    const { userId, blogId } = req.params;
    
    // Find the blog
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user has liked this blog
    if (!blog.likes || blog.likes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No likes found for this blog'
      });
    }
    
    // Find the index of the like by this user
    const likeIndex = blog.likes.findIndex(
      like => like && like.user && String(like.user) === String(userId)
    );
    
    if (likeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User like not found on this blog'
      });
    }
    
    // Remove the like
    blog.likes.splice(likeIndex, 1);
    await blog.save();
    
    res.status(200).json({
      success: true,
      message: 'User like deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteUserLikeById:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user like: ' + err.message
    });
  }
};

// @desc    Delete user comment by ID (for admin)
// @route   DELETE /api/users/:userId/activity/comments/:blogId/:commentId
// @access  Private/Admin
exports.deleteUserCommentById = async (req, res) => {
  try {
    const { userId, blogId, commentId } = req.params;
    
    // Find the blog
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if comment exists and belongs to user
    const commentIndex = blog.comments.findIndex(
      comment => comment._id.toString() === commentId && comment.user.toString() === userId
    );
    
    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or does not belong to the specified user'
      });
    }
    
    // Remove the comment
    blog.comments.splice(commentIndex, 1);
    await blog.save();
    
    res.status(200).json({
      success: true,
      message: 'User comment deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteUserCommentById:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment: ' + err.message
    });
  }
}; 