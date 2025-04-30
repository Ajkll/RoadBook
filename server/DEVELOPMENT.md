# Guide de développement simplifié pour RoadBook

Ce document présente l'approche simplifiée pour le développement du projet RoadBook.

## Architecture simplifiée

Nous avons adopté une approche hybride pour le développement :

1. **PostgreSQL dans Docker** - Base de données dans un conteneur Docker
2. **Application Node.js en local** - L'API et les outils s'exécutent en local

Cette approche offre plusieurs avantages :
- Évite les problèmes de mémoire dans les conteneurs Docker
- Facilite le développement incrémental
- Simplifie le processus de débogage

## Script unique : `roadbook.sh`

Un seul script pour gérer toutes les opérations de développement :

```bash
# Démarrer l'API en développement
./roadbook.sh dev

# Démarrer le serveur de test API (interface web)
./roadbook.sh test-api

# Exécuter les tests unitaires essentiels
./roadbook.sh test

# Lancer Prisma Studio
./roadbook.sh studio

# Appliquer les migrations
./roadbook.sh migrate

# Alimenter la base de données
./roadbook.sh seed
```

## Structure modulaire

Le système est organisé en 8 modules fonctionnels :

1. **Utilisateurs et Authentification**
   - Gestion des comptes, sécurité, JWT

2. **RoadBooks**  
   - Gestion des carnets d'apprentissage
   - Relations apprenti-guide

3. **Sessions**
   - Enregistrement des sessions de conduite
   - Géolocalisation et métriques

4. **Compétences**
   - Taxonomie de compétences
   - Progression et validation

5. **Communauté**
   - Système de posts et commentaires

6. **Badges**
   - Système de gamification

7. **Marketplace**
   - Échange de services et produits

8. **Notifications**
   - Système d'alertes

## Tests unitaires ciblés

Nous appliquons le principe de Pareto (80/20) pour les tests :
- Nous nous concentrons sur 20% des tests qui couvrent 80% des fonctionnalités
- Les tests essentiels sont :
  - `auth.service.test.ts`
  - `user.service.test.ts`
  - `roadbook.service.test.ts`
  - `basics.test.ts`

## Interface de test API

Une interface HTML/JS pour tester facilement les API :
- Accessible via `./roadbook.sh test-api` sur http://localhost:4001
- Organisation par modules fonctionnels
- Formulaires pré-remplis pour faciliter les tests

## Développement incrémental

Principes de développement :
1. Compléter entièrement un module avant de passer au suivant
2. Tester chaque endpoint immédiatement après son développement
3. Documenter au fur et à mesure
4. Séparer les responsabilités (services vs. contrôleurs)

## Variables d'environnement

Configuration par défaut :
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/roadbook_dev
JWT_SECRET=your-very-secure-jwt-secret-for-development
JWT_REFRESH_SECRET=your-very-secure-refresh-token-secret-for-development
```