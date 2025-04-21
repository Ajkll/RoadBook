# RoadBook Authentication System

This document explains the authentication system implemented in the RoadBook application.

## Overview

The authentication system is built on JWT (JSON Web Tokens) with a dual-token approach:
- **Access Token** (15 minutes expiry): Used for API authorization
- **Refresh Token** (7 days expiry): Used to obtain new access tokens when they expire

## Data Models

### User

```prisma
model User {
  id                String      @id @default(uuid())
  email             String      @unique
  passwordHash      String
  displayName       String
  firstName         String?
  lastName          String?
  nationalRegisterNumber String? @unique  
  birthDate         DateTime?
  phoneNumber       String?
  profilePicture    String?
  address           String?
  role              UserRole    @default(APPRENTICE)
  bio               String?     
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relations
  refreshTokens    RefreshToken[]
  // ... other relations
}

enum UserRole {
  APPRENTICE  // Learning driver
  GUIDE       // Parent or friend mentoring the apprentice
  INSTRUCTOR  // Professional driving instructor
  ADMIN       // System administrator
}
```

### RefreshToken

```prisma
model RefreshToken {
  id          String    @id @default(uuid())
  token       String    @unique
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  revoked     Boolean   @default(false)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
}
```

## User Authentication Flow

### Registration (`POST /api/auth/register`)
1. User submits registration data (email, password, etc.)
2. Server validates input data
3. Server creates user in the database with hashed password
4. Server generates and returns access token and refresh token
5. Client stores tokens

### Login (`POST /api/auth/login`)
1. User submits email and password
2. Server verifies credentials
3. Server generates and returns access token and refresh token
4. Client stores tokens

### Token Refresh (`POST /api/auth/refresh-token`)
1. When access token expires, client sends refresh token
2. Server verifies refresh token and issues a new access token
3. Client updates stored access token

### Logout (`POST /api/auth/logout`)
1. Client sends refresh token
2. Server invalidates refresh token
3. Client removes stored tokens

## Token Storage

- **Web Application**: Refresh token is stored in HTTP-only cookie for security, access token in memory
- **Mobile Application**: Both tokens are stored securely in the device's secure storage

## Token Verification

Protected routes use the `authenticateJWT` middleware which:
1. Extracts token from Authorization header
2. Verifies token signature and expiry
3. Attaches user payload to request object

## Role-Based Access Control

The `authorizeRoles` middleware restricts access based on user roles:
- **APPRENTICE**: Regular learner user
- **GUIDE**: Mentor user with additional permissions
- **INSTRUCTOR**: Professional teaching user with advanced permissions
- **ADMIN**: System administrator with full access

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and get tokens
- `POST /api/auth/refresh-token` - Get new access token
- `POST /api/auth/logout` - Invalidate refresh token
- `GET /api/auth/verify` - Verify token validity

### User Management
- `GET /api/users/me` - Get current user profile (requires authentication)
- `PUT /api/users/me` - Update current user profile (requires authentication)
- `PUT /api/users/me/password` - Change current user password (requires authentication)
- `GET /api/users/:id` - Get specific user profile (requires authentication)
- `PUT /api/users/:id` - Update specific user (requires authentication, own profile or admin)

## Authentication Middleware

```typescript
// Middleware to verify JWT access token
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the auth header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized - token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Add user data to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: "error",
        message: "Token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    
    return res.status(403).json({
      status: "error",
      message: "Forbidden - invalid token"
    });
  }
};

// Middleware to authorize based on user roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized - not authenticated"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden - insufficient privileges",
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};
```

## Testing

Test accounts with password `Password123!`:
- apprentice@roadbook.com (APPRENTICE role)
- guide@roadbook.com (GUIDE role)
- instructor@roadbook.com (INSTRUCTOR role)
- admin@roadbook.com (ADMIN role)

## Security Considerations

1. Access tokens have short lifespan (15 minutes)
2. Refresh tokens are stored in the database and can be revoked
3. Passwords are hashed with bcrypt (10 rounds)
4. HTTP-only cookies prevent XSS attacks on web
5. Secure storage on mobile prevents unauthorized access