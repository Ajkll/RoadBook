# Configuration Docker du projet RoadBook

Ce document explique la configuration Docker du projet RoadBook et comment l'utiliser.

## Fichiers Docker

Le projet utilise trois fichiers Docker Compose principaux:

1. **docker-compose.yml**: Configuration de production
2. **docker-compose.dev.yml**: Configuration de développement
3. **docker-compose.test.yml**: Configuration de test

## Scripts utilitaires

Pour simplifier l'utilisation de Docker, nous avons créé plusieurs scripts:

- **./roadbook.sh dev**: Démarrer l'environnement de développement complet
- **./roadbook.sh test**: Lancer les tests dans Docker
- **./roadbook.sh prod**: Démarrer l'environnement de production
- **./roadbook.sh reset**: Réinitialiser complètement l'environnement

## Environnement de développement

L'environnement de développement inclut:

- **PostgreSQL** sur le port 5433
- **API principale** sur le port 4000
- **Interface de test API** sur le port 4001
- **Prisma Studio** sur le port 5555

### Démarrage du développement

```bash
./roadbook.sh dev
```

Ce script:
1. Arrête les conteneurs existants
2. Libère les ports utilisés
3. Démarre les conteneurs Docker
4. Exécute les migrations
5. Remplit la base de données avec des données de test
6. Affiche les logs en temps réel

### Accès à l'environnement de développement

- API principale: http://localhost:4000/api
- Interface de test API: http://localhost:4001
- Prisma Studio: http://localhost:5555
- Base de données: postgresql://postgres:postgres@localhost:5433/roadbook_dev

## Environnement de test

Pour lancer les tests dans un environnement isolé:

```bash
./roadbook.sh test
```

## Environnement de production

Pour démarrer l'environnement de production:

```bash
./roadbook.sh prod
```

## Résolution de problèmes

Si vous rencontrez des problèmes avec Docker:

1. Réinitialisez complètement l'environnement:
   ```bash
   ./roadbook.sh reset
   ```

2. Vérifiez les logs:
   ```bash
   ./roadbook.sh docker:logs
   ```

3. Assurez-vous que les ports requis sont disponibles:
   - 4000, 4001, 5433, 5555 (développement)
   - 4002, 5434 (test)
   - 4000, 5432 (production)

## URL de connexion à la base de données

- **Dans les conteneurs Docker**: `postgresql://postgres:postgres@postgres-dev:5432/roadbook_dev`
- **Depuis votre machine locale**: `postgresql://postgres:postgres@localhost:5433/roadbook_dev`

## Utilisateurs de test

L'environnement de développement inclut les utilisateurs de test suivants:

- **Apprenti**: user@roadbook.com / password123
- **Guide**: guide@roadbook.com / password123
- **Admin**: admin@roadbook.com / password123