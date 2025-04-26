const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide content']
  },
  featuredImage: {
    type: String,
    // No default image - optional but when provided must meet criteria
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      // If author is admin, auto-approve, otherwise pending
      return this.isAdmin ? 'approved' : 'pending';
    }
  },
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: {
        type: String,
        required: true
      },
      comment: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for isAdmin (used in status default)
BlogSchema.virtual('isAdmin').get(function() {
  const adminStatus = this._isAdmin || false;
  console.log(`Getting isAdmin virtual property: ${adminStatus}`);
  return adminStatus;
});

BlogSchema.virtual('isAdmin').set(function(val) {
  console.log(`Setting isAdmin virtual property to: ${val}`);
  this._isAdmin = val;
});

// Virtual for like count
BlogSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
BlogSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

const Blog = mongoose.model('Blog', BlogSchema);

module.exports = Blog; 