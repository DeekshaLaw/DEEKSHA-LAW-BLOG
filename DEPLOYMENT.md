# DEEKSHA LAW Blog Platform - Deployment Guide

This document outlines how to deploy the DEEKSHA LAW Blog Platform to a production environment.

## Prerequisites

- Node.js (v16+)
- MongoDB Atlas account or self-hosted MongoDB (v4.4+)
- A domain name and SSL certificate
- Web hosting service (AWS, DigitalOcean, Heroku, etc.)

## Server Deployment

### Configuration

1. Set up environment variables by copying `.env.production` to `.env` on your production server:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret_key
JWT_EXPIRE=30d
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM="Deeksha Law <noreply@deekshalaw.com>"
NODE_ENV=production
```

2. Make sure to update the values with your secure information.

### Installation

1. Clone the repository on your server:
   ```
   git clone https://github.com/your-username/deeksha-law-blog.git
   cd deeksha-law-blog/server
   ```

2. Install dependencies:
   ```
   npm install --production
   ```

3. Start the server using a process manager (PM2 recommended):
   ```
   npm install -g pm2
   pm2 start server.js --name deeksha-law-api
   ```

4. Configure PM2 to start on system boot:
   ```
   pm2 startup
   pm2 save
   ```

### Nginx Configuration (Recommended)

```nginx
server {
    listen 80;
    server_name api.deekshalaw.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Add SSL configuration using Let's Encrypt.

## Client Deployment

### Building the Client

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Create a `.env.production` file with:
   ```
   VITE_API_URL=https://api.deekshalaw.com/api
   VITE_UPLOADS_URL=https://api.deekshalaw.com
   ```

3. Build the production bundle:
   ```
   npm install
   npm run build
   ```

4. The build output will be in the `dist` directory.

### Hosting Options

#### Option 1: Nginx (Same Server)

```nginx
server {
    listen 80;
    server_name deekshalaw.com www.deekshalaw.com;
    
    root /path/to/deeksha-law-blog/client/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Option 2: AWS S3 + CloudFront

1. Create an S3 bucket and configure it for static website hosting
2. Upload the contents of the `dist` directory to the bucket
3. Set up CloudFront with your domain and SSL certificate

#### Option 3: Netlify/Vercel

1. Connect your GitHub repository to Netlify/Vercel
2. Configure the build settings:
   - Build command: `cd client && npm install && npm run build`
   - Publish directory: `client/dist`
   - Environment variables: Set the same ones as in `.env.production`

## Domain & DNS Configuration

1. Point your domain's DNS to your hosting provider:
   - `deekshalaw.com` → Client deployment
   - `api.deekshalaw.com` → Server deployment

2. Set up SSL certificates for both domains (Let's Encrypt is a free option)

## Post-Deployment Checklist

- [ ] Test all APIs with production endpoints
- [ ] Verify user registration and login
- [ ] Check blog creation, editing, and approval workflows
- [ ] Test admin dashboards and functionality
- [ ] Verify email sending for registration, password reset, etc.
- [ ] Set up monitoring and logging (e.g., PM2 monitoring, Sentry)
- [ ] Create database backups
- [ ] Set up a deployment pipeline for future updates 