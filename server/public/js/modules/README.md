# RoadBook Frontend Modules

This directory contains client-side JavaScript modules that are used to interact with the RoadBook API.

## Available Modules

* `auth.js` - Authentication module for login, registration, and token management
* `users.js` - User management module for user profiles and settings
* `roadbooks.js` - Roadbook management module for creating and managing driving logs
* `sessions.js` - Session management module for tracking driving sessions
* `competencies.js` - Competency module for tracking and validating driving skills
* `badges.js` - Badge module for gamification and achievements

## Module Structure

Each module follows a similar structure:

1. Self-invoking function to create a module closure
2. Private variables and functions
3. Public API exposed through a return object
4. Global API integration

Example:

```javascript
const MyModule = (() => {
  // Private variables and functions
  const API_URL = '/api';
  
  // Public methods
  const publicMethod = async () => {
    // Implementation
  };
  
  // Return public API
  return {
    publicMethod
  };
})();

// Add to global API object
if (typeof API !== 'undefined') {
  API.MyModule = MyModule;
}
```

## Using the Modules

### Authentication

```javascript
// Login
await API.Auth.login(email, password);

// Check if user is authenticated
const isAuthenticated = API.Auth.isAuthenticated();

// Get current user
const user = await API.Auth.getCurrentUser();
```

### Roadbooks

```javascript
// Get all roadbooks
const roadbooks = await API.Roadbooks.getAllRoadbooks();

// Create a new roadbook
const newRoadbook = await API.Roadbooks.createRoadbook({
  title: "My Driving Journey",
  description: "Learning to drive"
});
```

### Sessions

```javascript
// Get sessions for a roadbook
const sessions = await API.Sessions.getRoadbookSessions(roadbookId);

// Create a new session
const newSession = await API.Sessions.createSession({
  roadbookId: 'roadbook-id',
  date: '2025-04-25',
  startTime: '2025-04-25T14:00:00Z',
  duration: 60,
  startLocation: "Home",
  endLocation: "School"
});
```

### Competencies

```javascript
// Get competency progress for a roadbook
const progress = await API.Competencies.getRoadbookProgress(roadbookId);

// Update competency status
await API.Competencies.updateCompetencyStatus(roadbookId, competencyId, {
  status: 'MASTERED',
  notes: 'Excellent control'
});
```

### Badges

```javascript
// Get user badges
const myBadges = await API.Badges.getMyBadges();

// Display badges in a container
API.Badges.displayUserBadges('badges-container');

// Check for new badges
const newBadges = await API.Badges.checkForNewBadges();

// View badge leaderboard
API.Badges.displayLeaderboard('leaderboard-container', 10);
```

## Error Handling

All modules include proper error handling. Errors are logged to the console and can be displayed to the user using the UIModule's showError method.

```javascript
try {
  await API.Badges.getMyBadges();
} catch (error) {
  UIModule.showError('Failed to load badges');
}
```