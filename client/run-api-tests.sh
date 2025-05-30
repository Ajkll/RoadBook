#!/bin/bash

echo "Transpiling API test script..."
npx tsc test-api-responses.ts --esModuleInterop --skipLibCheck

echo "Running API tests..."
node test-api-responses.js