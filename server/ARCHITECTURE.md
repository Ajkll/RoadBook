# Architecture Modulaire RoadBook

Ce document décrit l'architecture modulaire du backend RoadBook et explique comment les modules interagissent entre eux.

## Vue d'ensemble

L'application RoadBook est organisée en **modules fonctionnels** qui suivent chacun une architecture en couches:

```
               +----------------+
Client ------> |   API Routes   | ---+
               +----------------+    |
                       |             |
                       v             |
               +----------------+    |
               |  Controllers   |    |
               +----------------+    |
                       |             |
                       v             |
               +----------------+    |
               |    Services    | <--+
               +----------------+
                       |
                       v
               +----------------+
               |   Data Model   |
               +----------------+
```

### Structure des couches

1. **Routes API** (`src/api/routes/`)
   - Points d'entrée HTTP
   - Définition des endpoints
   - Regroupement logique par domaine

2. **Controllers** (`src/controllers/`)
   - Traitement des requêtes HTTP
   - Validation des entrées
   - Formatage des réponses

3. **Services** (`src/services/`)
   - Logique métier
   - Interactions avec la base de données
   - Règles fonctionnelles

4. **Data Model** (`prisma/schema.prisma`)
   - Définition du schéma de données
   - Relations entre entités
   - Types et contraintes

### Middleware transversaux

- **Authentification** (`src/middleware/auth.middleware.ts`)
- **Validation** (`src/middleware/validation.middleware.ts`)
- **Gestion d'erreurs** (`src/middleware/errors.middleware.ts`)

## Modules fonctionnels

### 1. Module Utilisateurs et Authentification

**Objectif:** Gérer les utilisateurs et leur authentification

**Fichiers principaux:**
- `src/services/auth.service.ts` - Logique d'authentification
- `src/services/user.service.ts` - Gestion des utilisateurs
- `src/controllers/auth.controller.ts` - Contrôleur d'authentification
- `src/controllers/user.controller.ts` - Contrôleur utilisateurs
- `src/api/routes/auth.routes.ts` - Routes d'authentification
- `src/api/routes/user.routes.ts` - Routes utilisateurs
- `src/middleware/auth.middleware.ts` - Middleware d'authentification

**Responsabilités:**
- Inscription et connexion
- Gestion des tokens JWT
- Profils utilisateur
- Contrôle d'accès basé sur les rôles

### 2. Module RoadBooks

**Objectif:** Gérer les carnets de route d'apprentissage

**Fichiers principaux:**
- `src/services/roadbook.service.ts` - Logique des roadbooks
- `src/controllers/roadbook.controller.ts` - Contrôleur roadbooks
- `src/api/routes/roadbook.routes.ts` - Routes roadbooks

**Responsabilités:**
- Création et gestion des roadbooks
- Relation apprenti-guide
- Cycle de vie des roadbooks (actif, complété, archivé)
- Statistiques et exportation

### 3. Module Sessions

**Objectif:** Gérer les sessions de conduite

**Fichiers principaux:**
- Services intégrés dans `roadbook.service.ts`
- Contrôleurs intégrés dans `roadbook.controller.ts`
- Routes intégrées dans `roadbook.routes.ts`

**Responsabilités:**
- Enregistrement des sessions
- Calcul de métriques (durée, distance)
- Validation des sessions
- Traitement des conditions de conduite

### 4. Module Compétences

**Objectif:** Suivre la progression des compétences

**Fichiers principaux:**
- `src/services/competency.service.ts` (à implémenter)
- `src/controllers/competency.controller.ts` (à implémenter)
- `src/api/routes/competency.routes.ts` (à implémenter)

**Responsabilités:**
- Suivi de la progression par compétence
- Validation des compétences
- Agrégation par phase et catégorie
- Recommandations d'apprentissage

### 5. Module Communauté

**Objectif:** Faciliter les interactions sociales

**Fichiers principaux:**
- `src/services/community.service.ts` (à implémenter)
- `src/controllers/community.controller.ts` (à implémenter)
- `src/api/routes/community.routes.ts` (à implémenter)

**Responsabilités:**
- Gestion des posts et commentaires
- Likes et interactions
- Modération de contenu
- Notifications sociales

### 6. Module Badges

**Objectif:** Gamifier l'apprentissage

**Fichiers principaux:**
- `src/services/badge.service.ts` (à implémenter)
- `src/controllers/badge.controller.ts` (à implémenter)
- `src/api/routes/badge.routes.ts` (à implémenter)

**Responsabilités:**
- Définition des badges et critères
- Attribution automatique des badges
- Affichage et historique
- Gamification de l'expérience

### 7. Module Marketplace

**Objectif:** Faciliter l'échange de services

**Fichiers principaux:**
- `src/services/marketplace.service.ts` (à implémenter)
- `src/controllers/marketplace.controller.ts` (à implémenter)
- `src/api/routes/marketplace.routes.ts` (à implémenter)

**Responsabilités:**
- Gestion des annonces
- Transactions virtuelles
- Système d'évaluation
- Filtres et recherche

### 8. Module Notifications

**Objectif:** Alerter les utilisateurs des événements importants

**Fichiers principaux:**
- `src/services/notification.service.ts` (à implémenter)
- `src/controllers/notification.controller.ts` (à implémenter)
- `src/api/routes/notification.routes.ts` (à implémenter)

**Responsabilités:**
- Génération des notifications
- Distribution multicanal
- Préférences utilisateurs
- Agrégation et prioritisation

## Communication inter-modules

Les modules communiquent principalement via:

1. **Appel direct des services**:
   ```typescript
   // Un service peut appeler un autre service
   import * as notificationService from '../services/notification.service';
   
   // Puis l'utiliser dans ses fonctions
   await notificationService.sendNotification(userId, 'COMPETENCY_MASTERED', { competencyId });
   ```

2. **Relations de données**:
   Les modèles Prisma définissent les relations entre entités, permettant aux services d'accéder aux données liées.

## Bonnes pratiques modulaires

1. **Séparation des préoccupations**:
   - Les services ne doivent pas contenir de logique HTTP
   - Les contrôleurs ne doivent pas contenir de logique métier
   - Les routes ne doivent pas contenir de logique de traitement

2. **Isolation fonctionnelle**:
   - Chaque module doit être aussi indépendant que possible
   - Les dépendances entre modules doivent être explicites
   - Éviter les dépendances circulaires

3. **Développement incrémental**:
   - Terminer un module avant de passer au suivant
   - Tester intégralement un module avant intégration
   - Documenter l'API de chaque module

4. **Transactions et cohérence**:
   - Utiliser des transactions pour les opérations multi-tables
   - Vérifier la cohérence des données entre modules
   - Gérer les cas d'erreur et rollbacks

## Modèle de données

Les principaux modèles et leurs relations sont:

```
User ──┬── RoadBook ──── Session
       │      │
       │      └─────── CompetencyProgress
       │
       ├── Post ──── Comment
       │      │
       │      └─────── Like
       │
       ├── MarketplaceListing ── Purchase
       │
       ├── UserBadge
       │
       ├── Notification
       │
       └── RefreshToken/PasswordReset
```

## Implémentation d'un nouveau module

Pour ajouter un nouveau module:

1. **Définir le modèle de données** dans `prisma/schema.prisma`
2. **Créer le service** avec la logique métier
3. **Développer le contrôleur** pour gérer les requêtes HTTP
4. **Définir les routes API** et middleware nécessaires
5. **Écrire les tests** unitaires et d'intégration
6. **Documenter l'API** dans les commentaires et le README

**Exemple: Module Compétences**

```typescript
// 1. Service (src/services/competency.service.ts)
export const getCompetencyProgress = async (roadbookId: string, userId: string) => {
  // Vérification d'accès, logique métier, etc.
};

// 2. Contrôleur (src/controllers/competency.controller.ts)
export const getProgress = async (req: JwtRequest, res: Response) => {
  try {
    const { id } = req.params; // roadbookId
    const userId = req.user?.userId;
    
    const progress = await competencyService.getCompetencyProgress(id, userId);
    
    res.status(200).json({
      status: "success",
      data: progress
    });
  } catch (error) {
    // Gestion d'erreur
  }
};

// 3. Routes (src/api/routes/competency.routes.ts)
const router = express.Router();
router.use(authenticateJWT);

router.get("/roadbooks/:id/competencies", competencyController.getProgress);

export default router;
```

## Extension modulaire

L'architecture permet d'ajouter des fonctionnalités sans impacter le reste du système:

1. **Nouvelles entités**: Ajouter des tables Prisma sans modifier les existantes
2. **Nouveaux endpoints**: Ajouter des routes sans changer les existantes
3. **Nouveaux services**: Implémenter des fonctionnalités indépendantes
4. **Nouvelles règles**: Ajouter la logique métier sans perturber l'existant