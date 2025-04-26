# DEEKSHA LAW Blogging Platform

A complete blogging platform for DEEKSHA LAW built using the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

### Authentication
- JWT-based authentication for users and admins with role-based access control
- OTP email verification on user registration
- Password hashing for secure storage

### User Features
- Register and login with email verification
- User dashboard with tabs for approved, pending, and rejected blogs
- Create blog posts with React Quill editor
- Upload featured images (optional)
- Select categories for blogs
- View blog post statuses
- Like and comment on approved blogs

### Admin Features
- Admin dashboard to manage all blogs
- Filter blogs by status, category, or user
- Approve or reject user-submitted blogs
- Post blogs directly (approved by default)
- Manage blog categories (create, edit, delete)
- View list of all registered users
- Promote users to admin or demote admins to users

### Guest Access
- View only approved blogs
- No ability to like, comment, or create blogs
- No access to any dashboard or restricted routes

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- NPM or Yarn

## Installation

### Clone the repository
```bash
git clone <repository-url>
cd deeksha-law
```

### Install backend dependencies
```bash
cd server
npm install
```

### Install frontend dependencies
```bash
cd ../client
npm install
```

### Configure Environment Variables
Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/deeksha_law
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@deekshalaw.com
```

## Running the Application

### Start the backend server
```bash
cd server
npm run dev
```

### Start the frontend development server
```bash
cd ../client
npm run dev
```

The frontend will be available at http://localhost:5173 and the backend API at http://localhost:5000.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/verify` - Verify email with OTP
- `POST /api/auth/resend-verification` - Resend verification OTP
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/logout` - Logout user

### Blogs
- `GET /api/blogs` - Get all blogs (filtered by status for non-admins)
- `GET /api/blogs/:id` - Get a single blog
- `POST /api/blogs` - Create a new blog
- `PUT /api/blogs/:id` - Update a blog
- `DELETE /api/blogs/:id` - Delete a blog
- `PUT /api/blogs/:id/status` - Update blog status (admin only)
- `POST /api/blogs/:id/comments` - Add a comment to a blog
- `PUT /api/blogs/:id/like` - Like/unlike a blog
- `GET /api/blogs/user/:status` - Get user blogs by status

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get a single category
- `POST /api/categories` - Create a new category (admin only)
- `PUT /api/categories/:id` - Update a category (admin only)
- `DELETE /api/categories/:id` - Delete a category (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get a single user (admin only)
- `PUT /api/users/:id` - Update a user (admin only)
- `DELETE /api/users/:id` - Delete a user (admin only)
- `PUT /api/users/profile` - Update user profile

## File Upload Requirements
- Allowed image types: .jpg, .jpeg, .png
- Minimum file size: 2MB
- Images stored in server/uploads/blogs/ directory

## License
This project is licensed under the MIT License. 