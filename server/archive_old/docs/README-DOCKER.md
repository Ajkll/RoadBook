# Guide de Développement avec Docker pour RoadBook

Ce document explique comment utiliser Docker pour développer, tester et déployer le serveur RoadBook.

## Installation Requise

- Docker
- Docker Compose

## Commandes Principales

### Démarrer l'Environnement de Développement

```bash
# Option 1: Environnement complet (API, test API, PostgreSQL, Prisma Studio)
./roadbook.sh dev:complete

# Option 2: Environnement de développement standard
./roadbook.sh dev
```

### Tester l'Application

```bash
# Exécuter tous les tests dans Docker
./roadbook.sh test:docker

# Exécuter des tests spécifiques
./roadbook.sh test:docker -- -t "nom du test"
```

### Utiliser l'Interface de Test API

Après avoir démarré l'environnement complet:

1. Ouvrez http://localhost:4001 dans votre navigateur
2. Utilisez l'un des comptes de test:
   - Apprenti: user@roadbook.com / Password123!
   - Guide: guide@roadbook.com / Password123!
   - Admin: admin@roadbook.com / Password123!

## Structure des Containers

### Environnement de Développement (`docker-compose.dev.yml`)

| Container       | Port | Description                           |
|-----------------|------|---------------------------------------|
| postgres-dev    | 5432 | Base de données PostgreSQL            |
| server-dev      | 4000 | Serveur API principal                 |
| test-api        | 4001 | Interface de test API                 |
| prisma-studio   | 5555 | Interface de gestion de base de données |

### Environnement de Test (`docker-compose.test.yml`)

| Container     | Port | Description                           |
|---------------|------|---------------------------------------|
| postgres-test | 5433 | Base de données PostgreSQL pour tests |
| test-server   | 4002 | Serveur exécutant les tests           |

### Production (`docker-compose.yml`)

| Container | Port | Description                    |
|-----------|------|--------------------------------|
| postgres  | 5432 | Base de données PostgreSQL     |
| server    | 4000 | Serveur API en mode production |

## Résolution de Problèmes

### Conflits de Ports

Si vous avez des erreurs de type "port is already allocated", vous pouvez:

```bash
# Arrêter tous les containers Docker
docker stop $(docker ps -aq)

# Ou tuer les processus sur les ports spécifiques
sudo lsof -i :5432  # Trouver le PID
sudo kill <PID>     # Tuer le processus
```

### Problèmes et Réinitialisation

Si vous rencontrez des problèmes avec l'environnement Docker, vous pouvez utiliser le script de réinitialisation:

```bash
# Réinitialiser complètement l'environnement
./roadbook.sh reset
```

Ce script va:
1. Arrêter tous les conteneurs
2. Tuer les processus en cours d'exécution
3. Libérer tous les ports utilisés
4. Reconstruire et redémarrer l'environnement
5. Appliquer les migrations et remplir la base de données

### Voir les Logs

```bash
# Voir les logs de tous les services
docker-compose -f docker-compose.dev.yml logs -f

# Voir les logs d'un service spécifique
docker-compose -f docker-compose.dev.yml logs -f server-dev
```

## Notes Importantes

- Les données de test sont automatiquement chargées au démarrage des conteneurs
- Toutes les modifications de code sont automatiquement rechargées en mode développement
- La base de données de développement conserve ses données tant que vous ne supprimez pas le volume Docker