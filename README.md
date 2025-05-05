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

# Gestion des versions - Workflow
 - Commandes disponibles
```bash
yarn check-version - Affiche la version actuelle (tag et package.json)
yarn release:patch - Crée un release patch (1.0.0 → 1.0.1)
yarn release:minor - Crée un release minor (1.0.0 → 1.1.0)
yarn release:major - Crée un release major (1.0.0 → 2.0.0)
yarn push-release - Push les changements + tags
yarn full-release:minor - Release minor + push automatique
```

- Workflow standard

   Avant de commencer :
   yarn check-version
   git pull origin main


   Lancer un release :
   yarn release:minor (ou patch/major)

   Vérifier les changements :
   git status
   cat CHANGELOG.md

   Publier :
   yarn push-release
   (ou yarn full-release:minor pour tout faire en une commande)

- Fichiers modifiés

    - package.json (version)

    - package-lock.json (version)

    - app.config.js (version Expo)

    - CHANGELOG.md (notes de version)

Les tags Git sont créés automatiquement avec le format vX.Y.Z


# Mises en Prod

Assurez vous d'utilisé expo go pour le dev en local

› Using Expo Go
› Press s │ switch to development build

pour la production nous avons la possibilité de construire nos .apk ou .aab ou autres avec les commandes suivantes (exemples):

- apk
```bash
eas build --platform android --profile preview
```

- aab

```bash
npx eas build --platform android
```

Note : beaucoup d'autres option sont ouvert , notre code etant clean sur l'utilisation de ses librairie.

# RoadBook - Testing Client

![CI Status](https://github.com/Yanstart/RoadBook/actions/workflows/ci.yml/badge.svg)

## Architecture de Tests

Emplacement des tests: `client/__tests__/

Notre suite de tests suit une approche multi-niveaux :

### Tests Unitaires
- Testent les fonctions individuelles de manière isolée
- Mockent toutes les dépendances externes
- Couvrent la logique métier pure

### Tests d'Intégration
- Vérifient les interactions entre modules
- Testent le comportement du système en conditions réelles
- Utilisent des mocks partiels pour les dépendances externes

### Tests de Performance
- Mesurent les temps de réponse
- Vérifient l'efficacité du cache
- Garantissent des performances minimales

### Tests de Sécurité
- Vérifient la protection des données sensibles
- Testent la robustesse face aux entrées invalides

[Voir les derniers résultats de tests](https://github.com/Yanstart/RoadBook/actions)

## Commandes de Test

Les tests sont intégrés directement dans le pipeline CI/CD. Vous pouvez exécuter certains tests localement en utilisant les commandes suivantes :



### Tests Unitaires
```bash
npm test -- --t "Unitaire"
```

### Tests d'Intégration
```bash
npm test -- --t "Integration"
```

### Tests de Performance
```bash
npm test -- --t "Performance"
```

### Tests de Sécurité
```bash
npm test -- --t "Security"
```

### Exécution de tous les tests
```bash
npm test
```

## CI/CD Pipeline Features

Le pipeline CI/CD est configuré pour exécuter des tests lors des pushes sur les branches `develop` et `main`, ainsi que lors des pull requests. Il vérifie notamment :

- **Linting** : Exécution d'ESLint pour analyser le code et générer des rapports.
- **Tests unitaires et d'intégration** : Tests couvrant les fonctionnalités principales du projet.
- **Tests de couverture** : Vérification de la couverture des tests.

Les résultats des tests sont disponibles dans le rapport de la suite CI/CD.

## Gestionnaire de paquets

Ce projet utilise **Yarn** pour gérer les dépendances.  
Merci de **ne pas utiliser `npm install`**, car cela peut créer des conflits avec `yarn.lock`.

### Installer les dépendances

```bash
yarn install



