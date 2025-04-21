# RoadBook Server

Backend pour l'application RoadBook.

## Prérequis

- Node.js v16+
- PostgreSQL 14+ (installé localement)
- npm ou yarn

## Procédure de lancement détaillée

### 1. Configuration initiale et installation

```bash
# Installation des dépendances
npm install

# Compiler le code TypeScript
npm run build

# Générer le client Prisma
npx prisma generate
```

> **Note:** La génération du client Prisma est nécessaire pour créer les types TypeScript correspondant à votre schéma de base de données.

### 2. Configuration de la base de données

Assurez-vous que PostgreSQL est en cours d'exécution sur votre machine.
 docker ps -a | grep postgres 
 docker-compose up -d ou   docker-compose up -d --build server

Vérifiez que le fichier `.env` contient bien les informations de connexion:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/roadbook"
JWT_SECRET="votre_secret_jwt"
JWT_REFRESH_SECRET="votre_refresh_secret_jwt"
```

Puis exécutez:
```bash
# Créer la base de données et appliquer les migrations
npx prisma migrate dev

# Remplir la base de données avec des données de test
npx prisma db seed
```

> **Important:** Si vous rencontrez des erreurs de connexion, vérifiez que PostgreSQL est bien démarré et que les informations dans `.env` sont correctes.

### 3. Lancement du serveur de développement

```bash
# Démarrer le serveur en mode développement
npm run dev
```

Le serveur sera disponible à l'adresse: http://localhost:4000/api

## Procédure de test simplifiée

Si vous souhaitez simplement tester que tout fonctionne correctement:

### 1. Test de la base de données avec Prisma Studio

Dans un nouveau terminal:
```bash
cd /chemin/vers/RoadBook/server
npx prisma studio
```

Prisma Studio s'ouvrira dans votre navigateur à l'adresse: http://localhost:5555

> **À vérifier:** Assurez-vous que les tables User, RoadBook, Session et RefreshToken sont présentes et contiennent des données.

### 2. Test de l'API via l'interface web

Pour lancer tout l'environnement de test en une seule commande:
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

### 3. Vérifications à effectuer

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

## Structure du projet

- `prisma/` - Schéma de base de données et migrations
- `src/api/routes/` - Points d'entrée API
- `src/controllers/` - Logique de traitement des requêtes
- `src/services/` - Logique métier et interaction avec la base de données
- `src/middleware/` - Middlewares (authentification, validation...)
- `src/utils/` - Fonctions utilitaires

## Flux d'authentification

1. Inscription (`/api/auth/register`) → crée un utilisateur et génère des tokens
2. Connexion (`/api/auth/login`) → vérifie les identifiants et génère des tokens
3. Rafraîchissement (`/api/auth/refresh-token`) → obtient un nouveau token d'accès
4. Déconnexion (`/api/auth/logout`) → révoque le token de rafraîchissement

## Modèles principaux

- `User` - Utilisateurs (avec différents rôles)
- `RoadBook` - Carnet de route principal
- `Session` - Sessions d'apprentissage 
- `RefreshToken` - Tokens de rafraîchissement











 1. Un README.md clair avec:
    - Des instructions détaillées pour l'installation
  et la configuration
    - Une procédure de test pas à pas
    - Des explications sur ce qu'il faut vérifier pour
   s'assurer que tout fonctionne
  2. Un script simplifié (launch-test-simple.sh) qui:
    - Compile le code
    - Propose d'appliquer les migrations et de seed la
   base
    - Démarre Prisma Studio en arrière-plan
    - Lance le serveur de test sur le port 4001
  3. Une commande npm (npm run test:simple) pour
  exécuter ce script facilement
  4. Une interface web de test pour interagir avec
  l'API sans avoir besoin d'un frontend complet

  Cette configuration vous permet de tester rapidement
   votre backend, de vous assurer que
  l'authentification fonctionne, et de vérifier que
  les opérations CRUD sont correctement implémentées,
  le tout sans dépendre de Docker ou d'autres outils
  externes.


 1. docker-compose.yml

  Ce fichier définit deux services
  Docker pour votre application:

  - postgres: Un container
  PostgreSQL qui:
    - Utilise l'image officielle
  PostgreSQL 14
    - Configure un utilisateur, mot
  de passe et base de données
  (postgres/postgres/roadbook)
    - Expose le port 5432 pour que
  votre application puisse y accéder
    - Conserve les données dans un
  volume pour la persistance
    - Inclut une vérification de
  santé pour s'assurer que
  PostgreSQL est prêt
  - server: Votre application
  Node.js qui:
    - Est construite à partir de
  votre Dockerfile.server
    - Expose le port 4000 pour l'API
    - Dépend du service PostgreSQL
  (attend qu'il soit en bonne santé)
    - Configure toutes les variables
   d'environnement nécessaires
    - Monte votre code source pour
  le développement

  2. Dockerfile.server

  Ce fichier définit comment
  construire l'image Docker pour
  votre serveur:

  - Utilise Node.js 18 sur Alpine
  Linux (léger)
  - Installe les outils nécessaires
  (comme PostgreSQL client)
  - Configure l'application,
  installe les dépendances
  - Génère le client Prisma
  - Crée un script de démarrage qui:
    - Attend que PostgreSQL soit
  disponible
    - Exécute les migrations Prisma
    - Crée des utilisateurs de test
    - Démarre l'application

  Comment utiliser ces fichiers:

  Pour lancer l'ensemble de
  l'environnement avec PostgreSQL et
   votre serveur:

  # Se placer dans le répertoire du 
  serveur
  cd /workspaces/RoadBook/server

  # Lancer tous les services en 
  arrière-plan
  docker-compose up -d

  Pour lancer uniquement PostgreSQL
  (si vous voulez exécuter le
  serveur Node.js directement):

  # Lancer uniquement PostgreSQL
  docker-compose up -d postgres

  Pour reconstruire l'image Docker
  après modifications:

  # Reconstruire et relancer le 
  serveur
  docker-compose up -d --build
  server

  C'est une très bonne configuration
   qui vous permet de:
  1. Avoir un environnement cohérent
   (fonctionne de la même façon sur
  toutes les machines)
  2. Ne pas avoir à installer
  PostgreSQL directement sur votre
  machine
  3. Avoir une configuration
  automatisée (scripts de démarrage,
   migrations, etc.)
  4. Facilement partager la
  configuration avec d'autres
  développeurs