# Guide de migration pour le nouveau gestionnaire Prisma

Ce guide explique comment migrer votre code existant vers le nouveau gestionnaire de connexion Prisma amélioré qui résout les erreurs de type "prepared statement does not exist".

## Script de migration automatique

Un script de migration automatique est disponible pour mettre à jour la plupart des imports dans vos fichiers:

```bash
# Depuis le répertoire racine du serveur
cd /workspaces/RoadBook/server
node src/scripts/migrate-prisma-imports.js
```

Ce script:
1. Met à jour `import { logger } from '../utils/logger'` vers `import logger from '../utils/logger'`
2. Met à jour `import { prismaManager } from '../config/prisma-manager'` vers `import prismaManager from '../config/prisma-manager'`
3. Met à jour `import { prisma } from '../config/prisma'` vers `import prisma from '../config/prisma'`

## Modifications manuelles nécessaires

Après avoir exécuté le script, certaines modifications manuelles peuvent être nécessaires:

### 1. Importation de Prisma dans les nouveaux fichiers

```typescript
// Ancienne méthode (NE PAS UTILISER)
import { prisma } from '../config/prisma';

// Nouvelle méthode recommandée
import prisma, { executeDbOperation, getPrismaClient } from '../config/prisma';
```

### 2. Utilisation de executeDbOperation pour les opérations critiques

Pour les opérations qui nécessitent une gestion fiable des erreurs de connexion:

```typescript
// Ancienne méthode (fonctionne mais sans gestion améliorée)
const user = await prisma.user.findUnique({ where: { id } });

// Nouvelle méthode recommandée
const user = await executeDbOperation(async (client) => {
  return client.user.findUnique({ where: { id } });
});
```

### 3. Méthodes spéciales comme $connect, $disconnect

Pour les méthodes spéciales de Prisma qui ne sont pas disponibles sur l'export par défaut:

```typescript
// Ancienne méthode
await prisma.$connect();

// Nouvelle méthode
const client = await getPrismaClient();
await client.$connect();
```

### 4. Opérations avec transactions

Pour les opérations qui nécessitent des transactions:

```typescript
// Ancienne méthode
const result = await prisma.$transaction(async (tx) => {
  // Opérations avec tx
});

// Nouvelle méthode 
const result = await executeDbOperation(async (client) => {
  return client.$transaction(async (tx) => {
    // Opérations avec tx
  });
});
```

## Types d'erreurs à rechercher

Après la migration, vérifiez les erreurs TypeScript suivantes:

1. **Erreurs d'importation**: Assurez-vous que toutes les importations utilisent la bonne syntaxe
   ```
   Module '"../utils/logger"' has no exported member 'logger'
   ```

2. **Accès aux modèles Prisma**: Vérifiez que tous les accès aux modèles Prisma fonctionnent
   ```
   Property 'user' does not exist on type...
   ```

3. **Méthodes spéciales**: Vérifiez les utilisations des méthodes spéciales de Prisma
   ```
   Property '$connect' does not exist on type...
   ```

## Dépannage

Si vous rencontrez des erreurs après la migration:

1. **Erreurs d'importation**: Vérifiez que vous importez correctement le module
   ```typescript
   import prisma from '../config/prisma';
   ```

2. **Erreurs d'accès aux modèles**: Utilisez directement le client Prisma importé
   ```typescript
   const user = await prisma.user.findUnique({ where: { id } });
   ```

3. **Erreurs de méthodes spéciales**: Utilisez getPrismaClient
   ```typescript
   const client = await getPrismaClient();
   await client.$disconnect();
   ```

4. **Opérations à haut risque**: Utilisez executeDbOperation
   ```typescript
   await executeDbOperation(async (client) => {
     // Opération critique
   });
   ```

## Bénéfices de la nouvelle approche

- Reconnexion automatique en cas d'erreur "prepared statement does not exist"
- Gestion des erreurs de connexion avec backoff exponentiel
- Monitoring de l'état de la connexion
- Meilleure stabilité de l'application
- Moins d'erreurs 500 pour les utilisateurs
- Maintien de la compatibilité avec le code existant