# RoadBook Application

RoadBook is a driving instruction management application designed to help apprentice drivers track their progress, connect with driving instructors, and manage their learning journey.

## Authentication System

The application implements a robust JWT-based authentication system with:

- **Access Tokens (15-minute expiry)**: Used for API authorization
- **Refresh Tokens (7-day expiry)**: Stored in both HTTP-only cookies (web) and secure storage (mobile)
- **Password security**: BCrypt hashing and validation
- **Role-based authorization**: Different access levels for APPRENTICE, GUIDE, INSTRUCTOR, and ADMIN users

### Authentication Flow

1. **User Registration**
   - Create an account with email/password and profile information
   - Secure validation with Zod
   - Automatic login after successful registration

2. **User Login**
   - Authenticate with email/password
   - Receive access and refresh tokens
   - Token storage in HTTP cookies (web) and secure storage (mobile)

3. **Protected Routes**
   - Access control based on authentication status
   - Role-based access restrictions
   - Redirect to login for unauthenticated users

4. **Token Refresh**
   - Automatic renewal of expired access tokens
   - Backend validation of refresh token authenticity
   - Silent token refresh in API client

5. **Secure Logout**
   - Token revocation on backend
   - Clearing of client-side storage
   - Redirect to login page

## Tech Stack

### Frontend (Client)
- React Native with Expo
- Expo Router for navigation
- Redux Toolkit for state management
- Axios for API requests
- Formik + Yup for form validation
- Expo SecureStore for token storage

### Backend (Server)
- Node.js with Express
- Prisma ORM with PostgreSQL
- JWT for authentication
- Zod for validation
- Winston for logging

## Getting Started

### Client
```bash
cd client
npm install
npm start
```

### Server
```bash
cd server
npm install
npm run docker:up    # Start PostgreSQL with Docker
npm run migrate:dev  # Run Prisma migrations
npm run dev         # Start development server
```

## API Routes

### Authentication
- POST /api/auth/register - Create a new user account
- POST /api/auth/login - Authenticate user and get tokens
- POST /api/auth/logout - Logout and invalidate tokens
- POST /api/auth/refresh-token - Get a new access token
- GET /api/auth/verify - Verify token validity

### Users
- GET /api/users/me - Get current user profile
- PUT /api/users/me - Update current user profile
- GET /api/users - Get all users (admin only)