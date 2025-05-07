# Module de Notifications

## Vue d'ensemble

Le module de notifications fournit un système complet pour créer, gérer et afficher des notifications aux utilisateurs. Il sert de couche de communication contextuelle pour informer les utilisateurs des événements importants comme les validations de session, les compétences maîtrisées, les badges obtenus et les interactions communautaires.

## Fonctionnalités

- Création et gestion des notifications
- Support pour différents types de notifications
- Notifications contextuelles et liées à des ressources spécifiques
- Agrégation intelligente pour éviter le spam
- Marquage des notifications comme lues
- Interface utilisateur réactive pour l'affichage des notifications
- Système de polling côté client pour les mises à jour en temps réel
- File d'attente pour les notifications non critiques

## Architecture

### Modèle de données

Le modèle de notification est conçu pour être flexible et extensible :

```prisma
enum NotificationType {
  SESSION_REMINDER
  SESSION_VALIDATION
  COMPETENCY_MASTERED
  BADGE_EARNED
  COMMENT_RECEIVED
  MARKETPLACE_UPDATE
}

model Notification {
  id                String           @id @default(uuid())
  userId            String
  user              User             @relation(fields: [userId], references: [id])
  type              NotificationType
  title             String
  message           String
  isRead            Boolean          @default(false)
  linkUrl           String?          
  createdAt         DateTime         @default(now())
}
```

### Services

Le module de notifications comprend un ensemble de services centralisés qui peuvent être utilisés par d'autres modules :

```typescript
// Exemples d'utilisation du service de notifications
import { createNotification } from '../services/notification.service';

// Créer une notification simple
await createNotification(
  userId,
  'BADGE_EARNED',
  'Badge obtenu',
  'Félicitations ! Vous avez obtenu un nouveau badge',
  '/profile/badges'
);

// Créer une notification de rappel de session
await createSessionReminderNotification(
  userId,
  sessionId,
  sessionDate,
  sessionTitle
);
```

### Agrégation intelligente

Pour éviter de submerger les utilisateurs avec trop de notifications similaires, le système inclut une fonction d'agrégation :

```typescript
// Exemple d'agrégation de notifications
const aggregateSimilarNotifications = async (userId: string): Promise<number> => {
  // Get recent unread notifications
  const recentNotifications = await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
      createdAt: {
        gte: new Date(Date.now() - 12 * 60 * 60 * 1000), // Last 12 hours
      },
    },
  });

  // Group by type and aggregate similar notifications
  // ...

  return aggregatedCount;
};
```

### API Backend

| Méthode | Endpoint | Description | Authentication |
|---------|----------|-------------|----------------|
| GET | /api/notifications | Liste des notifications de l'utilisateur | Requise |
| GET | /api/notifications/unread-count | Nombre de notifications non lues | Requise |
| PUT | /api/notifications/:id/read | Marquer une notification comme lue | Requise |
| PUT | /api/notifications/read-all | Marquer toutes les notifications comme lues | Requise |
| DELETE | /api/notifications/:id | Supprimer une notification | Requise |
| DELETE | /api/notifications | Supprimer toutes les notifications | Requise |
| POST | /api/notifications/cleanup | Nettoyer les anciennes notifications | Admin |

### Module Client JavaScript

Le module client JavaScript fournit des fonctionnalités pour :

1. **Récupérer les notifications**
   ```javascript
   const { notifications, total, unreadCount } = await API.Notifications.getNotifications();
   ```

2. **Gérer les notifications**
   ```javascript
   await API.Notifications.markAsRead(notificationId);
   await API.Notifications.markAllAsRead();
   await API.Notifications.deleteNotification(notificationId);
   ```

3. **Afficher les notifications**
   ```javascript
   // Afficher les notifications dans un conteneur
   API.Notifications.displayNotifications('notifications-container', {
     limit: 10,
     includeRead: false
   });
   
   // Mettre à jour l'indicateur de notifications non lues
   API.Notifications.updateNotificationIndicator(unreadCount);
   ```

4. **Système de polling pour les mises à jour en temps réel**
   ```javascript
   // Le module initialise automatiquement un système de polling
   // qui vérifie régulièrement les nouvelles notifications
   ```

## Meilleures pratiques

### Préférences utilisateur

Le système est conçu pour respecter les préférences des utilisateurs :
- Option pour voir uniquement les notifications non lues
- Capacité de marquer toutes les notifications comme lues en un clic
- Suppression facile des notifications individuelles

### File d'attente et traitement asynchrone

Pour les notifications non critiques, le système utilise un traitement asynchrone :
- Utilisation de transactions Prisma pour créer des lots de notifications
- Possibilité de prioriser certains types de notifications

### Traçabilité

Toutes les notifications sont horodatées et enregistrées dans la base de données :
- Historique complet des notifications pour analyse
- Nettoyage automatique des anciennes notifications lues

## Points d'attention particuliers

### Éviter le spam de notifications

Le module implémente plusieurs stratégies pour éviter de submerger les utilisateurs :
- Agrégation intelligente des notifications similaires
- Limitation du nombre de notifications visibles à la fois
- Préférences utilisateur pour les types de notifications

### Multicanal et extensibilité

Le système est conçu pour être extensible à d'autres canaux de notification :
- Structure de données indépendante du canal de livraison
- Préparation pour l'intégration future de notifications par email ou push

### Performance et scalabilité

Le module est optimisé pour les performances :
- Utilisation de pagination côté serveur
- Mise en cache côté client pour réduire les requêtes
- Requêtes optimisées avec sélection précise des champs

## Utilisation dans d'autres modules

Le système de notifications est intégré à plusieurs autres modules :

```typescript
// Sessions
await createSessionReminderNotification(userId, sessionId, sessionDate, sessionTitle);

// Compétences
await createCompetencyMasteredNotification(userId, competencyId, competencyName, roadbookId);

// Badges
await createBadgeEarnedNotification(userId, badgeId, badgeName);

// Communauté
// Notification lors d'un nouveau commentaire sur une publication...
```

## Documentation API complète

Pour une documentation complète de l'API, consultez les fichiers suivants :
- `src/services/notification.service.ts` - Services de notifications
- `src/controllers/notification.controller.ts` - Contrôleurs REST
- `src/api/routes/notification.routes.ts` - Définition des routes
- `public/js/modules/notifications.js` - Module client JavaScript