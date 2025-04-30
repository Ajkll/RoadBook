#!/bin/bash

echo "==== Setting up Testing Environment ===="

# Verify if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker first."
  exit 1
fi

# Check if there's already a server running on port 4000
if lsof -i:4000 > /dev/null 2>&1; then
  echo "Stopping existing server on port 4000"
  docker stop server 2>/dev/null || true
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Start database if it's not running
if ! docker ps | grep -q postgres; then
  echo "Starting PostgreSQL container..."
  docker-compose up -d postgres
  
  # Wait for database to be ready
  echo "Waiting for database to be ready..."
  sleep 5
fi

# Run database migrations
echo "Running migrations..."
npx prisma migrate deploy

# Seed the database
echo "Seeding the database..."
npx prisma db seed

echo "==== Setup Complete ===="
echo ""
echo "To start the test server: npm run dev"
echo "To access the test UI: http://localhost:4000/test-api.html"
echo "To start Prisma Studio: npx prisma studio"
echo ""
echo "Test users:"
echo "  - apprentice@roadbook.com (APPRENTICE)"
echo "  - guide@roadbook.com (GUIDE)"
echo "  - instructor@roadbook.com (INSTRUCTOR)"
echo "  - admin@roadbook.com (ADMIN)"
echo "Password: Password123!"