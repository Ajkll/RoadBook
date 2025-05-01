# RoadBook Server

API backend pour l'application RoadBook, un carnet de route numérique pour l'apprentissage de la conduite.

## Architecture simplifiée

Nous utilisons une approche hybride qui combine le meilleur des deux mondes :
- **PostgreSQL dans Docker** - Base de données conteneurisée
- **Application Node.js en local** - Meilleure performance et facilité de développement

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Démarrer l'environnement de développement complet
./roadbook.sh dev

# OU démarrer le serveur de test API
./roadbook.sh test-api
```

## Accès aux services

- **API principale**: http://localhost:4000/api
- **Interface de test API**: http://localhost:4001
- **Prisma Studio**: http://localhost:5555 (accessible via `./roadbook.sh studio`)

## Structure du projet

```
/server
├── src/               # Code source TypeScript
│   ├── api/           # Définitions des routes API
│   ├── controllers/   # Contrôleurs pour les requêtes HTTP
│   ├── services/      # Logique métier
│   ├── middleware/    # Middleware Express
│   ├── utils/         # Utilitaires partagés
│   └── tests/         # Tests unitaires et d'intégration
│
├── prisma/            # Modèles de données Prisma
│   ├── schema.prisma  # Schéma de la base de données
│   ├── migrations/    # Migrations Prisma
│   └── seeds/         # Données initiales pour la BDD
│
├── public/            # Interface de test API
└── roadbook.sh        # Script principal de développement
```

## Modules fonctionnels

Le système est divisé en 8 modules fonctionnels :

1. **Utilisateurs et Authentification**
2. **RoadBooks** - Carnets d'apprentissage
3. **Sessions** - Sessions de conduite
4. **Compétences** - Suivi des compétences
5. **Communauté** - Système social
6. **Badges** - Gamification
7. **Marketplace** - Échanges
8. **Notifications** - Alertes

## Commandes disponibles

Toutes les commandes sont accessibles via le script unique `roadbook.sh` :

```bash
./roadbook.sh dev          # Démarrer l'API en développement
./roadbook.sh test-api     # Démarrer l'interface de test API
./roadbook.sh test         # Exécuter les tests unitaires essentiels
./roadbook.sh studio       # Démarrer Prisma Studio
./roadbook.sh migrate      # Appliquer les migrations
./roadbook.sh seed         # Alimenter la base de données
```

## Documentation additionnelle

- [Architecture détaillée](./ARCHITECTURE.md)
- [Système d'authentification](./AUTH_SYSTEM.md) 
- [Guide de développement](./DEVELOPMENT.md)
- [Approche simplifiée](./SIMPLIFIED-APPROACH.md)

## Comptes de test

|Email|Mot de passe|Rôle|
|-----|------------|---|
|apprentice@roadbook.com|Password123!|APPRENTICE|
|guide@roadbook.com|Password123!|GUIDE|
|instructor@roadbook.com|Password123!|INSTRUCTOR|
|admin@roadbook.com|Password123!|ADMIN|