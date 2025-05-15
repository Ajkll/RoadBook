# Gestion des connexions Prisma

Ce document explique comment utiliser le gestionnaire de connexion Prisma amélioré pour éviter les erreurs de type "prepared statement does not exist" et autres problèmes de connexion à la base de données.

## Problème résolu

L'erreur suivante peut survenir lorsque la connexion à la base de données est interrompue ou lorsque des prepared statements sont perdus :

```
Error occurred during query execution:
ConnectorError(PostgresError { code: "26000", message: "prepared statement \"s302\" does not exist", severity: "ERROR" })
```

Ces erreurs sont souvent causées par :
- Des connexions perdues ou timeouts
- Un redémarrage du serveur PostgreSQL
- Des problèmes de pool de connexions
- Des requêtes longues qui maintiennent une connexion ouverte trop longtemps

## Solution implémentée

Nous avons créé un gestionnaire de connexion Prisma amélioré qui offre :

1. **Reconnexion automatique** : Détecte et réinitialise les connexions perdues
2. **Suivi de l'état de connexion** : Vérifie périodiquement que la connexion est active
3. **Retry avec backoff exponentiel** : Réessaie les opérations échouées avec un délai croissant
4. **Gestion des erreurs spécifiques** : Détecte et gère les erreurs liées aux prepared statements

## Comment utiliser le gestionnaire

### Approche 1 : Utiliser `executeDbOperation` (Recommandé)

Cette approche est la plus simple et convient à la plupart des cas d'utilisation :

```typescript
import { executeDbOperation } from '../config/prisma';

async function getUserById(id: string) {
  return await executeDbOperation(async (prisma) => {
    return prisma.user.findUnique({
      where: { id }
    });
  });
}
```

### Approche 2 : Utiliser `getPrismaClient`

Utilisez cette approche lorsque vous avez besoin de faire plusieurs opérations avec le même client :

```typescript
import { getPrismaClient } from '../config/prisma';

async function complexOperation() {
  const prisma = await getPrismaClient();
  
  // Plusieurs opérations avec le même client
  const user = await prisma.user.findUnique({ where: { id: '123' } });
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });
  
  return { user, posts };
}
```

### Approche 3 : Utiliser `prismaManager.executeWithRetry`

Pour un contrôle plus précis sur les tentatives de reconnexion :

```typescript
import { prismaManager } from '../config/prisma-manager';

async function criticalOperation() {
  return await prismaManager.executeWithRetry(async (prisma) => {
    // Opération critique avec la base de données
    return await prisma.$transaction(async (tx) => {
      // Transaction avec plusieurs étapes
    });
  }, 5); // 5 tentatives maximum
}
```

## Migration du code existant

Lorsque vous mettez à jour le code existant, suivez ces recommandations :

1. Remplacez les utilisations directes de `prisma` par `executeDbOperation`
2. Pour les opérations complexes ou les transactions, utilisez `getPrismaClient`
3. Ajoutez une gestion d'erreur appropriée

### Exemple de migration

Avant :
```typescript
import { prisma } from '../config/prisma';

async function getUser(id: string) {
  return await prisma.user.findUnique({ where: { id } });
}
```

Après :
```typescript
import { executeDbOperation } from '../config/prisma';

async function getUser(id: string) {
  try {
    return await executeDbOperation(async (prisma) => {
      return prisma.user.findUnique({ where: { id } });
    });
  } catch (error) {
    logger.error(`Error getting user ${id}:`, error);
    throw new Error('Failed to retrieve user');
  }
}
```

## Bonnes pratiques

1. **Utilisez des transactions** pour les opérations qui modifient plusieurs tables
2. **Gérez les erreurs** de manière spécifique dans chaque service
3. **Limitez la durée des requêtes** pour éviter les timeouts
4. **Fermez proprement les connexions** lorsque l'application s'arrête
5. **Évitez de garder des références** au client Prisma dans des variables globales

## Debugging

Si vous rencontrez encore des problèmes de connexion :

1. Vérifiez les logs pour les erreurs liées à la base de données
2. Assurez-vous que la base de données est accessible depuis votre environnement
3. Vérifiez que les variables d'environnement sont correctement configurées
4. Contrôlez la charge sur la base de données et les temps de réponse