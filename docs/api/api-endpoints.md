# RoadBook API Documentation

## Authentication

### POST /api/auth/login
- Login with email and password
- Returns JWT token

### POST /api/auth/refresh-token
- Refresh access token using refresh token

## Users

### POST /api/users
- Create a new user

### GET /api/users/me
- Get current user profile

### PUT /api/users/me
- Update current user profile

## RoadBooks

### GET /api/roadbooks
- Get all roadbooks for current user

### POST /api/roadbooks
- Create a new roadbook

### GET /api/roadbooks/:id
- Get roadbook by ID

### PUT /api/roadbooks/:id
- Update roadbook

### DELETE /api/roadbooks/:id
- Delete roadbook

## Sessions

### GET /api/roadbooks/:id/sessions
- Get all sessions for a roadbook

### POST /api/roadbooks/:id/sessions
- Add a new session to a roadbook

### GET /api/sessions/:id
- Get session details

### PUT /api/sessions/:id
- Update session

### DELETE /api/sessions/:id
- Delete session

## Competencies

### GET /api/competencies
- Get all competencies

### GET /api/roadbooks/:id/competencies
- Get competency progress for a roadbook

### PUT /api/competencies/:id/validate
- Validate a competency for a session
