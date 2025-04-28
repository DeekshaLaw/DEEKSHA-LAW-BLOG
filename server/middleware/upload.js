const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/blogs/');
  },
  filename: function(req, file, cb) {
    // Generate a random string for the filename
    const randomString = crypto.randomBytes(16).toString('hex');
    // Sanitize the original filename
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `blog-${randomString}-${sanitizedOriginalName}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed file types with their MIME types
  const allowedMimeTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true
  };
  
  // Check mime type
  if (allowedMimeTypes[file.mimetype]) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG and WEBP images are allowed!'));
  }
};

// Check file size
const fileSizeChecker = (req, file, cb) => {
  // 50 KB minimum requirement
  const minSize = 50 * 1024; // 50 KB in bytes
  const maxSize = 2 * 1024 * 1024; // 2MB max size
  
  if (file.size > maxSize) {
    return cb(new Error('File size must be less than 2MB'));
  }
  
  if (file.size < minSize) {
    return cb(new Error('File size must be at least 50KB'));
  }
  
  cb(null, true);
};

// Create middleware
const uploadMiddleware = (req, res, next) => {
  // Initialize upload with enhanced security options
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
      fileSize: 2 * 1024 * 1024, // 2MB max size
      files: 1 // Only allow one file
    }
  }).single('featuredImage');

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle specific Multer errors
      let message = 'Upload error: ';
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          message += 'File size exceeds 2MB limit';
          break;
        case 'LIMIT_FILE_COUNT':
          message += 'Only one file is allowed';
          break;
        default:
          message += err.message;
      }
      return res.status(400).json({
        success: false,
        message
      });
    } else if (err) {
      // Handle other errors
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // If file was uploaded, perform additional checks
    if (req.file) {
      // Check minimum size
      const minSize = 50 * 1024; // 50KB in bytes
      if (req.file.size < minSize) {
        // Delete the uploaded file if it's too small
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Image must be at least 50KB in size'
        });
      }
      
      // Sanitize the file path
      const sanitizedPath = path.normalize(req.file.path).replace(/\\/g, '/');
      
      // Set the file path
      req.featuredImage = `/uploads/blogs/${path.basename(sanitizedPath)}`;
    }

    next();
  });
};

module.exports = uploadMiddleware; 