const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Verify Cloudinary configuration
console.log('Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'API key is set' : 'API key is missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'API secret is set' : 'API secret is missing'
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'deeksha-law/blogs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 500, crop: 'limit' }]
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  console.log('Checking file type:', file.mimetype);
  
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
    console.log('Invalid file type:', file.mimetype);
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG and WEBP images are allowed!'));
  }
};

// Create middleware
const uploadMiddleware = (req, res, next) => {
  console.log('Upload middleware started');
  
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
      console.error('Multer error:', err);
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
      console.error('Upload error:', err);
      // Handle other errors
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    console.log('File upload successful:', req.file);
    
    // If file was uploaded successfully, the Cloudinary URL will be in req.file.path
    if (req.file) {
      console.log('Setting featuredImage to:', req.file.path);
      req.featuredImage = req.file.path; // This will be the Cloudinary URL
    } else {
      console.log('No file was uploaded');
    }

    next();
  });
};

module.exports = uploadMiddleware; 