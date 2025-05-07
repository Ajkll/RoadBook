# Guide de test de l'API RoadBook

Ce document explique comment rapidement configurer et tester l'API RoadBook en utilisant l'interface de test d'API et les données de démonstration.

## Configuration rapide

Pour démarrer rapidement l'environnement de test avec des données pré-remplies :

```bash
# Option 1: Configuration simplifiée (la plus facile)
./roadbook.sh dev:simple

# Option 2: Avec Docker (plus robuste, mais plus complexe)
./roadbook.sh dev:complete
```

Pour arrêter tous les serveurs lancés avec l'option simplifiée:

```bash
./simple-cleanup.sh
```

## Comptes de test disponibles

Les comptes suivants sont disponibles pour tester l'application :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| user@roadbook.com | Password123! | APPRENTICE |
| guide@roadbook.com | Password123! | GUIDE |
| admin@roadbook.com | Password123! | ADMIN |

## Utilisation de l'interface de test

1. Ouvrez l'interface de test dans votre navigateur : http://localhost:4001
2. Utiliser les endpoints d'authentification pour vous connecter :
   - `POST /api/auth/login` avec les informations d'un des comptes ci-dessus
   - Le token JWT obtenu est automatiquement stocké et utilisé pour les appels suivants

## Tester les principales fonctionnalités

### Authentification

- `POST /api/auth/login` - Se connecter
- `POST /api/auth/register` - Créer un nouveau compte
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/me` - Obtenir les informations de l'utilisateur connecté
- `POST /api/auth/logout` - Se déconnecter

### Utilisateurs

- `GET /api/users` - Obtenir la liste des utilisateurs
- `GET /api/users/:id` - Obtenir les détails d'un utilisateur
- `PUT /api/users/:id` - Mettre à jour un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### RoadBooks

- `GET /api/roadbooks` - Obtenir la liste des roadbooks
- `GET /api/roadbooks/:id` - Obtenir les détails d'un roadbook
- `POST /api/roadbooks` - Créer un nouveau roadbook
- `PUT /api/roadbooks/:id` - Mettre à jour un roadbook
- `DELETE /api/roadbooks/:id` - Supprimer un roadbook

## Utilisation de Prisma Studio

Prisma Studio vous permet de visualiser et de modifier directement les données dans la base de données.

1. Accéder à Prisma Studio : http://localhost:5555
2. Explorer les différents modèles de données
3. Ajouter, modifier ou supprimer des enregistrements

## Résolution des problèmes courants

### Problèmes de connexion à la base de données

```bash
# S'assurer que Docker est en cours d'exécution
docker ps

# Redémarrer les conteneurs
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Alimenter la base de données
./roadbook.sh seed:quick
```

### Erreurs d'authentification

Si vous obtenez des erreurs 401 ou 403, vérifiez que :

1. Vous êtes bien connecté avec un compte valide
2. Le token JWT n'est pas expiré (utilisez /api/auth/refresh)
3. Le compte utilisé a les permissions nécessaires pour l'action

### Échec des tests

Si les tests échouent, vous pouvez essayer :

```bash
# Nettoyer et reconstruire l'environnement
docker-compose -f docker-compose.dev.yml down -v
./roadbook.sh dev:complete
```