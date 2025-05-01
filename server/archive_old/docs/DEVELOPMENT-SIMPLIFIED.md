# Guide de développement simplifié pour RoadBook

Ce document décrit l'approche simplifiée pour le développement et les tests du projet RoadBook.

## Architecture simplifiée

Au lieu d'une architecture entièrement conteneurisée, nous avons adopté une approche hybride :

1. **PostgreSQL dans Docker** - La base de données est exécutée dans un conteneur Docker pour faciliter le déploiement et éviter les conflits d'installation
2. **Application Node.js en local** - L'application et les outils de développement sont exécutés localement pour plus d'efficacité et moins de problèmes de mémoire

## Scripts de lancement

Nous avons créé plusieurs scripts simplifiés pour faciliter le développement :

- `launch-dev-simple.sh` - Lance PostgreSQL dans Docker, applique les migrations, effectue le seeding et démarre l'API localement
- `launch-test-unit.sh` - Lance les tests unitaires avec une base de données temporaire
- `launch-essential-tests.sh` - Lance uniquement les tests essentiels (20% qui couvrent 80% des fonctionnalités)
- `launch-test-api-simple.sh` - Lance le serveur de test API avec interface HTML pour tester les endpoints

## Approche de test

Nous suivons le principe de Pareto (80/20) pour les tests :

1. **Tests unitaires ciblés** - Focus sur 20% des tests qui couvrent 80% des fonctionnalités essentielles
2. **Tests essentiels prioritaires** :
   - `auth.service.test.ts` - Authentification (login, tokens, sécurité)
   - `user.service.test.ts` - Gestion des utilisateurs
   - `roadbook.service.test.ts` - Fonctionnalités de base des roadbooks

## Structure modulaire

Le système est divisé en 8 modules principaux, basés sur le schéma Prisma :

1. **Utilisateurs et Authentification** - Gestion des comptes, sécurité, sessions
2. **RoadBooks** - Carnets d'apprentissage, relations apprenti-guide
3. **Sessions** - Enregistrement des sessions de conduite
4. **Compétences** - Suivi des compétences et validations
5. **Communauté** - Fonctionnalités sociales
6. **Badges** - Système de gamification
7. **Marketplace** - Échange de services et produits
8. **Notifications** - Système d'alertes et messages

## Développement incrémental

Principes clés pour le développement :

- **Compléter un module avant de passer au suivant**
- **Tester immédiatement** chaque endpoint après l'avoir développé
- **Documenter progressivement** les fonctionnalités
- **Séparer les responsabilités** - Services fonctionnels vs contrôleurs HTTP

## Interface de test API

Une interface HTML/JS est disponible pour tester facilement les endpoints :

- Accessible à l'adresse `http://localhost:4001/` après lancement du serveur de test
- Organisée par modules fonctionnels
- Inclut des formulaires pour tester tous les endpoints
- Affiche les réponses JSON formatées

## Variables d'environnement

Les scripts utilisent les variables d'environnement suivantes :

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/roadbook_dev
JWT_SECRET=your-very-secure-jwt-secret-for-development
JWT_REFRESH_SECRET=your-very-secure-refresh-token-secret-for-development
```

## Prochaines étapes

1. Implémenter les modules de base (Auth, Users, Roadbooks)
2. Développer les modules complémentaires 
3. Ajouter une couverture de tests progressive
4. Optimiser l'interface de test API