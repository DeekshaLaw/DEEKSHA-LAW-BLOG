# DEEKSHA LAW Blog Platform

A professional legal blogging platform that allows users to create, read, and interact with legal content.

## Features

- **User Authentication**: Registration, login, email verification, and password reset
- **Blog Management**: Create, edit, and publish blogs with rich text editor
- **Admin Dashboard**: Approve/reject blogs, manage categories, and user administration
- **Interactive Features**: Comments and likes on blogs
- **Responsive Design**: Works on all devices

## Technology Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads

### Frontend
- React.js
- React Router
- Axios for API calls
- React Quill for rich text editing
- Bootstrap for styling

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account or local MongoDB instance
- Git

### Development Setup

#### Backend

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file (copy from `.env.example` and fill in your values)

4. Start the development server:
   ```
   npm run dev
   ```

#### Frontend

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.development` file (it should already be configured)

4. Start the development server:
   ```
   npm run dev
   ```

## Production Deployment

For detailed production deployment instructions, please refer to [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deployment with Docker

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values
3. Run the deployment script:
   ```
   bash deploy.sh
   ```

## Project Structure

```
deeksha-law-blog/
├── client/              # React frontend
│   ├── public/          # Static files
│   │   ├── assets/      # Images and assets
│   │   ├── components/  # React components
│   │   ├── config/      # Configuration files
│   │   ├── context/     # React context providers
│   │   └── pages/       # Page components
│   ├── .env.development # Development environment variables
│   └── .env.production  # Production environment variables
├── server/              # Node.js backend
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── .env             # Environment variables
├── docker-compose.yml   # Docker Compose configuration
└── deploy.sh            # Deployment script
```

## License

This project is proprietary and owned by DEEKSHA LAW.

## Contact

For support or inquiries, please contact [support@deekshalaw.com](mailto:support@deekshalaw.com). 