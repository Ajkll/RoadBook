# Guide de développement du module Profil

Ce document décrit l'implémentation de la fonctionnalité Profil dans l'application RoadBook, servant à la fois de documentation et de guide des bonnes pratiques pour les futurs développeurs.

## 📋 Table des matières
- [Architecture](#architecture)
- [Composants et Structure](#composants-et-structure)
- [Services API](#services-api)
- [Gestion d'état](#gestion-détat)
- [Gestion des erreurs](#gestion-des-erreurs)
- [Problèmes courants et solutions](#problèmes-courants-et-solutions)
- [Bonnes pratiques](#bonnes-pratiques)

## 🏗️ Architecture

Le module Profil suit une architecture par couches :

```
📂 app/(tabs)/profile.tsx      # Composant principal (UI + logique)
📂 app/services/api/           # Couche d'accès aux données
  ├── auth.api.ts              # API authentification et profil
  ├── notification.api.ts      # API notifications
  ├── badge.api.ts             # API badges
📂 app/types/                  # Types et interfaces
  └── auth.types.ts            # Types liés au profil et à l'authentification
```

## 🧩 Composants et Structure

Le composant principal `ProfileScreen` est structuré en sections accessibles par onglets :

```tsx
/**
 * Écran de profil utilisateur avec gestion des informations personnelles,
 * de la sécurité, des notifications, de la confidentialité et des badges.
 * 
 * @component
 * @returns {JSX.Element} Composant ProfileScreen rendu
 */
export default function ProfileScreen() {
  // État et logique...
  
  return (
    <View style={styles.container}>
      {/* En-tête avec photo de profil */}
      <View style={styles.header}>
        {/* ... */}
      </View>
      
      {/* Navigation entre sections */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal>
          {/* Onglets de navigation */}
        </ScrollView>
      </View>
      
      {/* Contenu principal */}
      <ScrollView style={styles.content}>
        {renderContent()} // Affiche la section active
      </ScrollView>
    </View>
  );
}
```

### Sections du profil

Chaque section est implémentée comme une fonction séparée pour faciliter la maintenance :

```tsx
/**
 * Affiche les informations personnelles de l'utilisateur
 * avec possibilité d'édition
 * 
 * @returns {JSX.Element} La section profil rendue
 */
const renderProfileSection = () => {
  return (
    <View>
      {/* Contenu... */}
    </View>
  );
};

// Autres sections: renderSecuritySection, renderNotificationsSection, etc.
```

## 🌐 Services API

Les services API suivent une structure cohérente pour interagir avec le backend :

### auth.api.ts

```typescript
/**
 * Service d'API pour l'authentification et la gestion du profil utilisateur
 * @module authApi
 */
export const authApi = {
  /**
   * Récupère le profil de l'utilisateur actuellement connecté
   * @async
   * @returns {Promise<User>} Les données de l'utilisateur
   * @throws {Error} En cas d'échec de récupération
   */
  getCurrentUser: async (): Promise<User> => {
    /* Implémentation... */
  },
  
  /**
   * Met à jour le profil de l'utilisateur
   * @async
   * @param {Partial<User>} userData - Les données à mettre à jour
   * @returns {Promise<User>} Les données mises à jour
   * @throws {Error} En cas d'échec de la mise à jour
   */
  updateUserProfile: async (userData: Partial<User>): Promise<User> => {
    /* Implémentation... */
  },
  
  // Autres méthodes...
};
```

### Gestion des endpoints manquants

Pour les API en développement, nous utilisons une approche progressive avec des données simulées :

```typescript
/**
 * Récupère les sessions actives de l'utilisateur
 * Utilise des données simulées si l'API n'est pas disponible
 * 
 * @async
 * @returns {Promise<any[]>} Liste des sessions
 */
getUserSessions: async (): Promise<any[]> => {
  // Fonction pour générer des données simulées
  const getMockSessions = () => [/* données simulées */];
  
  try {
    // Tentative d'appel API
    const response = await apiClient.get(`/users/${userId}/sessions`);
    return extractApiData<any[]>(response);
  } catch (error) {
    // Si endpoint 404, utiliser données simulées
    if (error.response?.status === 404) {
      console.log('API endpoint non disponible, utilisation de données simulées');
      return getMockSessions();
    }
    throw error;
  }
}
```

## 🧠 Gestion d'état

L'état est géré localement avec des hooks React pour chaque type de données :

```typescript
// État utilisateur principal
const [user, setUser] = useState<User | null>(null);
const [editing, setEditing] = useState(false);
const [editedUser, setEditedUser] = useState<Partial<User>>({});

// État des sections spécifiques
const [notifications, setNotifications] = useState<Notification[]>([]);
const [badges, setBadges] = useState<UserBadge[]>([]);
const [sessions, setSessions] = useState<any[]>([]);

// État UI
const [currentSection, setCurrentSection] = useState('profile');
const [loading, setLoading] = useState(true);
const [loadingError, setLoadingError] = useState('');
```

### Chargement initial des données

```typescript
/**
 * Effet pour charger toutes les données utilisateur au démarrage
 * Utilise une approche robuste avec gestion d'erreurs indépendante pour chaque API
 */
useEffect(() => {
  const loadUserData = async () => {
    setLoading(true);
    
    // Données de secours pour les API manquantes
    const mockData = {/* ... */};
    
    try {
      // 1. Chargement du profil (obligatoire)
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      
      // 2. Chargement des données complémentaires (indépendant)
      try {
        const userNotifications = await notificationApi.getNotifications();
        setNotifications(userNotifications);
      } catch (error) {
        console.log('Erreur notifications:', error);
        setNotifications(mockData.notifications);
      }
      
      // Idem pour badges et sessions...
    } catch (error) {
      setLoadingError('Impossible de charger votre profil');
    } finally {
      setLoading(false);
    }
  };
  
  loadUserData();
}, []);
```

## 🛡️ Gestion des erreurs

Le module implémente une gestion d'erreurs à plusieurs niveaux :

### 1. Niveau service API

```typescript
try {
  const response = await apiClient.get('/endpoint');
  return processResponse(response);
} catch (error) {
  // Analyse et classification des erreurs
  if (error.response?.status === 401) {
    throw new Error('Session expirée');
  } else if (!error.response) {
    throw new Error('Problème de connexion réseau');
  } else {
    throw new Error('Erreur serveur');
  }
}
```

### 2. Niveau composant

```typescript
// Vérification systématique avant manipulation des données
{!notifications || notifications.length === 0 ? (
  <Text>Pas de notifications</Text>
) : (
  notifications.map(notification => (/* ... */))
)}

// Protection des méthodes map/filter
{notifications && notifications.filter(n => !n.isRead).length > 0 && (
  <View style={styles.badge}>
    <Text>{notifications.filter(n => !n.isRead).length}</Text>
  </View>
)}
```

### 3. Affichage utilisateur

```tsx
if (loading && !user) {
  return <LoadingScreen message="Chargement du profil..." />;
}

if (loadingError) {
  return (
    <ErrorView 
      message={loadingError}
      onRetry={() => loadUserData()} 
    />
  );
}
```

## 🐛 Problèmes courants et solutions

### Chemins d'importation dans les dossiers avec parenthèses

**Problème** : Les chemins relatifs ne fonctionnent pas correctement avec les dossiers ayant des parenthèses (convention Next.js/Expo Router).

**Solution** : Utiliser un niveau de profondeur en moins pour les imports depuis un dossier avec parenthèses.

```typescript
// ❌ INCORRECT
import { authApi } from '../../services/api/auth.api';

// ✅ CORRECT
import { authApi } from '../services/api/auth.api';
```

### Manipulation de données potentiellement undefined

**Problème** : Erreurs lors de l'accès aux propriétés de données qui peuvent être `undefined` suite à des échecs d'API.

**Solution** : Toujours vérifier l'existence des données avant de les utiliser.

```typescript
// ❌ INCORRECT
notifications.filter(n => !n.isRead)

// ✅ CORRECT
notifications && notifications.filter(n => !n.isRead)
```

### Gestion des endpoints non implémentés

**Problème** : Erreurs 404 lorsqu'un endpoint n'est pas encore disponible sur le backend.

**Solution** : Implémenter une gestion spécifique pour les 404 avec des données simulées.

```typescript
try {
  return await apiClient.get('/endpoint');
} catch (error) {
  if (error.response?.status === 404) {
    console.log('Endpoint non disponible, utilisation de données simulées');
    return mockData;
  }
  throw error;
}
```

## 🌟 Bonnes pratiques

### 1. Documentation JSDoc

Documenter toutes les fonctions et composants avec JSDoc :

```typescript
/**
 * Gère la déconnexion d'une session utilisateur spécifique
 * @param {string} sessionId - Identifiant de la session à déconnecter
 * @returns {Promise<void>}
 */
const handleLogoutSession = async (sessionId: string): Promise<void> => {
  /* Implémentation... */
};
```

### 2. Utilisation de types stricts

Définir des interfaces précises pour tous les objets :

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  // autres propriétés...
}

// Utilisation avec les Hooks
const [user, setUser] = useState<User | null>(null);
```

### 3. Approche défensive

Toujours prévoir les cas d'erreur et les données manquantes :

```typescript
// Accès sécurisé aux propriétés
const userName = user?.displayName || 'Utilisateur';

// Valeurs par défaut pour les objets manquants
const notifications = userNotifications || [];

// Vérifications avant manipulation
if (Array.isArray(sessions) && sessions.length > 0) {
  // Traitement...
}
```

### 4. Séparation des préoccupations

Chaque fichier/fonction a une responsabilité unique :

- `profile.tsx` : Interface utilisateur et logique de présentation
- `auth.api.ts` : Logique d'accès aux données d'authentification
- `types/auth.types.ts` : Définitions de types

### 5. Développement progressif

Implémentation par étapes avec des fonctionnalités pouvant fonctionner indépendamment :

1. UI statique avec données simulées
2. Connexion aux API disponibles
3. Remplacement progressif des données simulées
4. Optimisations et améliorations UX

---

## 🔄 Contribution et maintenance

Pour contribuer au module Profil :

1. Respectez les conventions de nommage et la structure existante
2. Documentez votre code avec JSDoc
3. Ajoutez des vérifications robustes pour les données
4. Testez tous les scénarios (données présentes, données manquantes, erreurs API)

Pour toute question, contactez l'équipe de développement RoadBook.

---

Document créé le 16 mai 2024