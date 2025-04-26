const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/blogs/');
  },
  filename: function(req, file, cb) {
    cb(null, `blog-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const filetypes = /jpeg|jpg|png|webp/;
  
  // Check the file extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, .png and .webp image files are allowed!'));
  }
};

// Check file size
const fileSizeChecker = (req, file, cb) => {
  // 50 KB minimum requirement
  const minSize = 50 * 1024 ; // 50 KB in bytes
  
  // Using multer size checker with storage
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB max size
  }).single('featuredImage');

  upload(req, file, (err) => {
    if (err) {
      return cb(err);
    }

    // If no file uploaded, continue
    if (!req.file) {
      return cb(null);
    }

    // Check if file size is at least 50 KB
    if (req.file.size < minSize) {
      return cb(new Error('File size must be at least 50KB'));
    }

    cb(null);
  });
};

// Create middleware
const uploadMiddleware = (req, res, next) => {
  // Initialize upload
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB max size
  }).single('featuredImage');

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred during upload
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // If file was uploaded, check minimum size
    if (req.file) {
      const minSize = 50 * 1024; // 50KB in bytes
      if (req.file.size < minSize) {
        return res.status(400).json({
          success: false,
          message: 'Image must be at least 50KB in size'
        });
      }
      
      // Set the file path
      req.featuredImage = `/uploads/blogs/${req.file.filename}`;
    }

    next();
  });
};

module.exports = uploadMiddleware; 