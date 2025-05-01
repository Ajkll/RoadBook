#!/bin/bash

# Script to set up and run tests in the RoadBook server

echo "===== Setting up RoadBook test environment ====="

# Create .env.test if it doesn't exist
if [ ! -f ".env.test" ]; then
    echo "Creating .env.test file..."
    cat > .env.test << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/roadbook_test
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/roadbook_test
JWT_SECRET=test-jwt-secret-for-testing
JWT_REFRESH_SECRET=test-refresh-token-secret-for-testing
PORT=4002
NODE_ENV=test
EOF
fi

# Check if postgres container is running
if ! docker ps | grep -q postgres; then
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    echo "Waiting for PostgreSQL to start..."
    sleep 5
fi

# Create test database
echo "Creating test database if it doesn't exist..."
docker exec postgres psql -U postgres -c "CREATE DATABASE roadbook_test;" 2>/dev/null || true

# Run Prisma migrations on the test database
echo "Running Prisma migrations on test database..."
export NODE_ENV=test
npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma

echo "==== Test environment ready. Running tests... ===="

# Run tests with Jest
npm test $@

echo "===== Tests completed ====="