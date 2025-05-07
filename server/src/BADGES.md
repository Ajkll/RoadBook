# Badge Module Documentation

## Overview

The Badge module implements a comprehensive gamification system for the RoadBook application, allowing users to earn badges for their achievements during their driving education journey. This creates engagement, motivation, and recognition for learners.

## Features

- Badge management (CRUD operations)
- Badge assignment and revocation
- Automatic badge checking and awarding based on user actions
- Badge leaderboard for social competition
- Badge progress tracking
- Badge categories and criteria
- Notification system integration

## Implementation Details

### Core Components

1. **Badge Model** - Defined in the Prisma schema
   - Badge metadata (name, description, image, category)
   - Badge criteria for automatic awarding
   - Relationships with users

2. **Badge Service** - Business logic for badge operations
   - Badge retrieval and filtering
   - Badge awarding and revocation logic
   - Badge criteria checking
   - Leaderboard generation

3. **Badge Controller** - HTTP request handling
   - RESTful API endpoints
   - Authentication and authorization
   - Error handling and response formatting

4. **Badge Routes** - API route definitions
   - Public and private routes
   - Admin-only routes
   - Route parameters and validation

5. **Badge Validation** - Input validation with Zod
   - Schema definitions for badge operations
   - Validation middleware

6. **Client-side Module** - Frontend JS for badge interaction
   - API client functions
   - Badge display and rendering
   - Badge progress visualization
   - Leaderboard display

### Badge Criteria System

The badge module includes an extensible criteria system that can automatically award badges based on user activities:

- **FIRST_SESSION** - Awarded after completing the first driving session
- **COMPLETE_10_SESSIONS** - Awarded after completing 10 driving sessions
- **NIGHT_DRIVING** - Awarded for driving at night
- **HIGHWAY_DRIVING** - Awarded for highway driving experience
- **MASTER_PARKING** - Awarded for mastering parking maneuvers
- **MASTER_ECO_DRIVING** - Awarded for mastering all eco-driving competencies
- **VALIDATE_10_SESSIONS** - Awarded to guides/instructors who validate 10 sessions
- **COMPLETE_ROADBOOK** - Awarded for completing a roadbook

### API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|--------------|
| `/api/badges` | GET | Get all badges | No |
| `/api/badges/:badgeId` | GET | Get a specific badge | No |
| `/api/badges/categories/:category` | GET | Get badges by category | No |
| `/api/badges/leaderboard` | GET | Get badge leaderboard | No |
| `/api/badges/users/me` | GET | Get current user's badges | Yes |
| `/api/badges/users/:userId` | GET | Get a user's badges | Yes |
| `/api/badges/check` | POST | Check and award new badges | Yes |
| `/api/badges` | POST | Create a new badge | Yes (Admin) |
| `/api/badges/:badgeId` | PUT | Update a badge | Yes (Admin) |
| `/api/badges/:badgeId` | DELETE | Delete a badge | Yes (Admin) |
| `/api/badges/award` | POST | Award a badge to a user | Yes (Admin) |
| `/api/badges/:badgeId/users/:userId` | DELETE | Revoke a badge from a user | Yes (Admin) |

## Integration with Other Modules

The badge module integrates with several other modules:

1. **Session Module** - Badges are awarded based on session completion, night driving, etc.
2. **Competency Module** - Badges are awarded for mastering specific competencies
3. **Roadbook Module** - Badges are awarded for roadbook completion
4. **User Module** - Badges are displayed on user profiles
5. **Notification Module** - Users receive notifications when badges are awarded

## Usage Examples

### Checking for New Badges

```typescript
// After completing a session or mastering a competency
await badgeService.checkAndAwardBadges(userId);
```

### Displaying User Badges on Frontend

```javascript
// Get and display user badges
const userBadges = await API.Badges.getMyBadges();
API.Badges.displayUserBadges('badge-container');

// Show badge progress
API.Badges.displayBadgeProgress('progress-container');
```

### Manually Awarding a Badge (Admin)

```typescript
// Award a special badge to a user
await badgeService.awardBadge(userId, badgeId);
```

## Future Enhancements

- Badge expiration or time-limited badges
- Badge sharing on social media
- Badge achievement levels (bronze, silver, gold)
- Custom badge creation by instructors
- Badge prerequisites (must earn X before earning Y)
- More advanced gamification features (points, levels, etc.)