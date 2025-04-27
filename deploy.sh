#!/bin/bash

# Deeksha Law Blog - Deployment Script

# Exit on error
set -e

echo "=== Deeksha Law Blog - Deployment Script ==="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it from .env.example"
  exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo "Error: docker-compose is not installed. Please install Docker and docker-compose."
  exit 1
fi

echo "=== Pull latest code ==="
git pull

echo "=== Building and starting containers ==="
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "=== Deployment completed successfully ==="
echo "The application should now be accessible at:"
echo "- Client: https://deekshalaw.com"
echo "- API: https://api.deekshalaw.com"

echo ""
echo "To view logs:"
echo "docker-compose logs -f" 