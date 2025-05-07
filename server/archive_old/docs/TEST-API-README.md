# API Testing Environment for RoadBook

This document provides an overview of the API testing environment created to facilitate development and testing of the RoadBook server modules.

## Overview

I've set up a complete testing environment that includes:

1. **Modern Web UI for API Testing** - A modular interface that mirrors the backend architecture
2. **Automated Docker Container Management** - Scripts to handle database containers
3. **TestContainers Integration** - For isolated test environments
4. **Streamlined Development Scripts** - Central utility script for all operations

## Key Components

### 1. API Test Interface

A modern web-based interface that allows testing of all API endpoints:

- Located at http://localhost:4001 when the test server is running
- Organized by modules (Auth, Users, RoadBooks, Sessions) like the backend
- Includes comprehensive forms and displays for all API operations
- Styled with a clean, modern CSS design

### 2. Development Scripts

Several scripts have been created or enhanced:

- **./roadbook.sh** - Central utility script that provides access to all commands
- **launch-dev.sh** - Now also starts the test API server
- **launch-test-containers.sh** - New script for testing with isolated containers

### 3. Docker Integration

The development environment now properly integrates with Docker:

- Auto-detects and starts required containers
- Configures database connections appropriately
- Supports both local and containered development

### 4. TestContainers Support

Added support for testing with ephemeral containers:

- Each test run gets its own clean database container
- No test data pollution between runs
- Works great for CI/CD environments

## How to Use

### Starting the Development Environment

```bash
./roadbook.sh dev
```

This will:
1. Start the PostgreSQL container if needed
2. Apply migrations if requested
3. Start Prisma Studio (http://localhost:5555)
4. Start the test API server (http://localhost:4001)
5. Start the main development server (http://localhost:4002)

### Running Tests with TestContainers

```bash
./roadbook.sh test:containers
```

### Starting Just the Test API

```bash
./roadbook.sh test:api
```

## Test UI Usage Guide

1. Open http://localhost:4001 in your browser
2. Start by logging in with one of the test accounts (e.g., apprentice@roadbook.com / Password123!)
3. Navigate through the modules to test different API endpoints
4. Use the API Debug tab to see detailed API responses

## Architecture

The test interface follows a modular approach that matches the backend:

- **Auth Module** - Login, registration, token management
- **Users Module** - Profile management and user administration
- **RoadBooks Module** - Creation and management of learning logs
- **Sessions Module** - Driving session recording and tracking

The interface is built with:
- Clean HTML5 and CSS3 with CSS variables for theming
- Vanilla JavaScript for API interactions
- Modern UX patterns (cards, badges, responsive layout)