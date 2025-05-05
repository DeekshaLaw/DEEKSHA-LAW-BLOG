# Build stage for the React frontend
FROM node:18-alpine as client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm install

# Copy client source code and .env file
COPY client/ .

# Build the React app with environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-https://deeksha-law-blog-d09x.onrender.com/api}
RUN npm run build

# Build stage for the Express backend
FROM node:18-alpine as server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm install --production

# Copy server source code
COPY server/ .

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy built server from server-builder
COPY --from=server-builder /app/server /app

# Copy built React app from client-builder to server's public directory
COPY --from=client-builder /app/client/dist /app/public

# Create necessary directories
RUN mkdir -p /app/uploads

# Expose port 5000
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the server
CMD ["npm", "start"] 