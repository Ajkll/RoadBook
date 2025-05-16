# Gestion des données utilisateur avec User Context

Ce document explique l'approche adoptée pour gérer les données utilisateur dans l'application RoadBook.

## Architecture de gestion des données utilisateur

Nous avons mis en place une architecture robuste pour gérer les données utilisateur, conçue pour être résiliente face aux problèmes de stockage sécurisé et de connectivité.

### 1. Contextes séparés pour l'authentification et les données utilisateur

Notre application utilise deux contextes React distincts:

- **AuthContext**: Gère l'authentification (connexion/déconnexion, tokens, état d'authentification)
- **UserContext**: Gère les données utilisateur (profil, statistiques, activité)

Cette séparation permet:
- Une meilleure organisation du code
- Une résilience accrue (un problème avec le profil n'affecte pas l'authentification)
- Une optimisation des performances (moins de re-rendus inutiles)

### 2. Stratégie de stockage à plusieurs niveaux

Les données sont stockées à plusieurs niveaux, avec des mécanismes de repli:

1. **En mémoire** (state React + variable globale)
   - Accès le plus rapide
   - Persiste pendant la session utilisateur
   - Se réinitialise au redémarrage de l'application

2. **Stockage sécurisé** (expo-secure-store)
   - Stockage crypté et persistant
   - Pas disponible sur toutes les plateformes
   - Peut parfois échouer sur certains appareils

3. **AsyncStorage** (fallback)
   - Stockage non-crypté mais persistant
   - Compatible avec plus de plateformes

4. **LocalStorage** (web uniquement)
   - Utilisé comme fallback sur les plateformes web

Cette approche "multi-couche" garantit que même en cas d'échec d'une méthode de stockage, l'application peut continuer à fonctionner.

### 3. Mise en cache intelligente

Les données utilisateur sont:
- Chargées au démarrage depuis le stockage local
- Mises à jour depuis le serveur en arrière-plan
- Conservées en mémoire même en cas d'échec de mise à jour

Pour les données enrichies (statistiques, activité récente), nous:
- Les chargeons uniquement lorsqu'elles sont nécessaires
- Les mettons en cache pour éviter des requêtes répétées

## Comment utiliser les contextes

### Utilisation de AuthContext

Pour les fonctionnalités liées à l'authentification:

```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { isAuthenticated, login, logout } = useAuth();
  
  // Utilisation
  if (isAuthenticated) {
    // L'utilisateur est connecté
  }
}
```

### Utilisation de UserContext

Pour accéder aux données de l'utilisateur:

```tsx
import { useUser } from '../context/UserContext';

function ProfileComponent() {
  const { 
    userData,              // Données utilisateur principales
    refreshUserData,       // Recharger les données depuis le serveur
    updateUserProfile,     // Mettre à jour le profil
    loadUserStats,         // Charger les statistiques
    loadUserActivity,      // Charger l'activité récente
    isLoading,             // Indicateur de chargement
  } = useUser();
  
  // Exemple d'utilisation
  useEffect(() => {
    refreshUserData();
    loadUserStats();
  }, []);
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <View>
      <Text>{userData?.displayName}</Text>
      <Text>{userData?.email}</Text>
      {userData?.stats && (
        <Text>Sessions: {userData.stats.totalSessions}</Text>
      )}
    </View>
  );
}
```

## Gestion des erreurs

Notre système est conçu pour gérer gracieusement différents types d'erreurs:

1. **Erreurs de stockage**: 
   - Utilisation de mécanismes de fallback
   - Journalisation détaillée pour le débogage
   - Conservation des données en mémoire

2. **Erreurs réseau**:
   - Affichage des données en cache en cas d'échec
   - Tentatives de nouvelle connexion
   - Journalisation des erreurs

3. **Erreurs d'authentification**:
   - Détection automatique des tokens expirés
   - Déconnexion gracieuse en cas de problème d'authentification

## Architecture des données utilisateur

Les données utilisateur suivent le schéma ci-dessous:

```typescript
interface ExtendedUser extends User {
  // Données de base (toujours chargées)
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  role: UserRole;
  
  // Données enrichies (chargées à la demande)
  stats?: {
    totalSessions: number;
    totalDistance: number;
    badgesCount: number;
    competencyProgress: {
      notStarted: number;
      inProgress: number;
      mastered: number;
    };
  };
  
  activity?: {
    lastSessionDate?: string;
    recentSessions?: Array<{
      id: string;
      date: string;
      duration: number;
      distance?: number;
    }>;
    upcomingReminders?: Array<{
      id: string;
      title: string;
      date: string;
    }>;
  };
}
```

## Améliorations futures

- Synchronisation en arrière-plan des données utilisateur
- Mise en cache plus avancée avec TTL (Time To Live)
- Support hors ligne complet avec queue de modifications
- Optimistic updates pour une meilleure expérience utilisateur