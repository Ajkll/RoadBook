# RoadBook Server - Backend API

Ce dépôt contient l'API backend pour l'application RoadBook, une plateforme de gestion d'apprentissage de conduite.

## Architecture Modulaire

Le backend est développé selon une **architecture modulaire**, organisée autour des domaines fonctionnels suivants:

### Structure des Modules

1. **Module 01: Utilisateurs et Authentification**
   - Gestion des utilisateurs (profils, rôles)
   - Authentification (inscription, connexion, jetons)
   - Sécurité avec JWT et tokens de rafraîchissement

2. **Module 02: RoadBooks**
   - Gestion des carnets de route d'apprentissage
   - Cycles de vie (actif, complété, archivé)
   - Relation apprenti-guide
   - Statistiques et métriques

3. **Module 03: Sessions de Conduite**
   - Enregistrement des sessions pratiques
   - Traçage des heures, distances et conditions
   - Validation des sessions par guides/instructeurs

4. **Module 04: Compétences**
   - Suivi des compétences par roadbook
   - Progression (non commencé → en cours → maîtrisé)
   - Validation des compétences acquises

5. **Module 05: Communauté**
   - Posts et commentaires
   - Partage d'expériences
   - Réactions (likes)

6. **Module 06: Badges (Gamification)**
   - Système de récompenses
   - Motivation par accomplissements
   - Reconnaissance des progrès

7. **Module 07: Marketplace**
   - Échange de services (mentorat, cours)
   - Produits liés à l'apprentissage
   - Gestion des transactions

8. **Module 08: Notifications**
   - Alertes système
   - Rappels de sessions
   - Annonces de validations

### Architecture technique

Pour chaque module, l'architecture suit une structure en couches:

- **Model** (Prisma Schema): Définition des entités et relations dans `/prisma/schema.prisma`
- **Services**: Logique métier dans `/src/services/{module}.service.ts`
- **Contrôleurs**: Gestionnaires HTTP dans `/src/controllers/{module}.controller.ts`
- **Routes**: Points d'entrée API dans `/src/api/routes/{module}.routes.ts`
- **Tests**: Tests unitaires et d'intégration dans `/src/tests/{module}.*.test.ts`

## Prérequis

- Node.js v18+
- PostgreSQL 14+
- npm

## Configuration

1. **Installation des dépendances**:
   ```bash
   npm install
   ```

2. **Configuration de l'environnement**:
   Créez un fichier `.env` basé sur `.env.example`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/roadbook"
   JWT_SECRET="your-jwt-secret"
   JWT_REFRESH_SECRET="your-refresh-token-secret"
   PORT=4002
   NODE_ENV=development
   ```

3. **Migration de la base de données**:
   ```bash
   npm run migrate:dev
   ```

4. **Génération du client Prisma**:
   ```bash
   npm run prisma:generate
   ```

## Lancement

### Développement

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Tests

```bash
# Exécuter tous les tests
npm test

# Tester un module spécifique
npm test -- -t "Auth Service"

# Mode watch
npm run test:watch
```

### API Test UI

Pour faciliter les tests manuels, une interface HTML de test est disponible:

```bash
npm run test:api
```

Puis accédez à http://localhost:4001/

## Procédure de test simplifiée

Si vous souhaitez simplement tester que tout fonctionne correctement:

```bash
# Script complet de lancement interactif
npm run test:simple
```

Ce script va:
1. Compiler le code TypeScript
2. Générer le client Prisma si nécessaire
3. Vous proposer d'appliquer les migrations et de seed la base de données
4. Démarrer Prisma Studio en arrière-plan
5. Lancer le serveur de test API

> **Note:** Le script vérifie et arrête automatiquement tout processus utilisant déjà le port 4001.

Accédez aux interfaces de test dans votre navigateur:
- Interface API: http://localhost:4001
- Prisma Studio: http://localhost:5555

### Vérifications à effectuer

1. **Test d'authentification:**
   - Connectez-vous avec l'utilisateur `apprentice@roadbook.com` / `Password123!`
   - Vérifiez que les tokens sont bien générés (affichés en vert dans l'interface)
   - Testez la fonction "Get My Profile" pour vérifier que l'authentification est fonctionnelle

2. **Test de création d'objet:**
   - Connectez-vous si ce n'est pas déjà fait
   - Créez un nouveau RoadBook avec le formulaire dédié
   - Actualisez la liste de vos RoadBooks pour vérifier qu'il apparaît
   - Vérifiez dans Prisma Studio qu'une nouvelle ligne a été ajoutée dans la table RoadBook

3. **Test des différents rôles:**
   - Déconnectez-vous puis reconnectez-vous avec `admin@roadbook.com` / `Password123!`
   - Testez la fonction "Get All Users" qui devrait fonctionner uniquement pour les admins

### Utilisateurs de test pré-configurés

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `apprentice@roadbook.com` | `Password123!` | APPRENTICE |
| `guide@roadbook.com` | `Password123!` | GUIDE |
| `instructor@roadbook.com` | `Password123!` | INSTRUCTOR |
| `admin@roadbook.com` | `Password123!` | ADMIN |

## Configuration Docker

Vous pouvez également utiliser Docker pour lancer votre environnement de développement:

```bash
# Lancer PostgreSQL uniquement
docker-compose up -d postgres

# Lancer tout l'environnement (PostgreSQL + serveur)
docker-compose up -d

# Reconstruire et relancer le serveur après modifications
docker-compose up -d --build server
```

## Architecture des authentifications et sécurité

Le système d'authentification utilise une approche à double token:

- **Access Token**: Token JWT de courte durée (15min) pour l'accès aux ressources protégées
- **Refresh Token**: Token de longue durée (7 jours) stocké en BDD pour obtenir de nouveaux access tokens

Caractéristiques de sécurité:
- Rotation des refresh tokens (un nouveau token à chaque rafraîchissement)
- Détection des tentatives de réutilisation de tokens (blocage de tous les tokens lors d'une détection)
- Stockage des mots de passe avec bcrypt
- Protection contre les attaques par force brute
- Contrôles d'accès basés sur les rôles (RBAC)

## Documentation API

### Routes Authentification

- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion et génération de token
- `POST /api/auth/logout` - Déconnexion (révocation de token)
- `POST /api/auth/refresh-token` - Rafraîchissement du token d'accès
- `GET /api/auth/verify` - Vérification de validité du token
- `POST /api/auth/forgot-password` - Demande de réinitialisation
- `POST /api/auth/reset-password` - Réinitialisation avec token

### Routes Utilisateurs

- `GET /api/users/me` - Profil de l'utilisateur connecté
- `PUT /api/users/me` - Mise à jour du profil
- `PUT /api/users/me/password` - Changement de mot de passe
- `GET /api/users` - Liste des utilisateurs (admin)
- `GET /api/users/:id` - Détails d'un utilisateur
- `DELETE /api/users/:id` - Suppression d'un utilisateur

### Routes Roadbooks

- `GET /api/roadbooks` - Liste des roadbooks de l'utilisateur
- `POST /api/roadbooks` - Création d'un roadbook
- `GET /api/roadbooks/guided` - Roadbooks où l'utilisateur est guide
- `GET /api/roadbooks/:id` - Détails d'un roadbook
- `PUT /api/roadbooks/:id` - Mise à jour d'un roadbook
- `DELETE /api/roadbooks/:id` - Suppression d'un roadbook
- `PATCH /api/roadbooks/:id/status` - Changement de statut
- `POST /api/roadbooks/:id/guide` - Assignation d'un guide
- `GET /api/roadbooks/:id/statistics` - Statistiques d'un roadbook
- `GET /api/roadbooks/:id/export` - Exportation (JSON/PDF)

### Routes Sessions

- `GET /api/roadbooks/:id/sessions` - Sessions d'un roadbook
- `POST /api/roadbooks/:id/sessions` - Ajout d'une session

### Routes Compétences

- `GET /api/roadbooks/:id/competencies` - Progression compétences
- `PATCH /api/roadbooks/:id/competencies/:competencyId` - Mise à jour progression

## Structure des dossiers

```
server/
├── prisma/                 # Schéma de base de données et migrations
│   ├── migrations/         # Migrations Prisma
│   ├── schema.prisma       # Définition du schéma de données
│   └── seeds/              # Données de test (seeding)
├── src/
│   ├── api/                # Définition des routes API
│   │   └── routes/
│   ├── config/             # Configuration (DB, Firebase, etc.)
│   ├── controllers/        # Contrôleurs HTTP
│   ├── middleware/         # Middleware Express (auth, validation)
│   ├── services/           # Logique métier
│   ├── tests/              # Tests unitaires et d'intégration
│   └── utils/              # Utilitaires (logging, validation, etc.)
├── public/                 # Interface HTML de test
└── dist/                   # Code compilé (build)
```

## Flux d'authentification

1. Inscription (`/api/auth/register`) → crée un utilisateur et génère des tokens
2. Connexion (`/api/auth/login`) → vérifie les identifiants et génère des tokens
3. Rafraîchissement (`/api/auth/refresh-token`) → obtient un nouveau token d'accès
4. Déconnexion (`/api/auth/logout`) → révoque le token de rafraîchissement