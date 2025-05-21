# Guide d'utilisation des API dans les pages routes

Ce guide explique comment utiliser les API endpoints centralisés dans les pages comme my-routes.

## Structure API centralisée

Le projet utilise un système d'API centralisé pour faciliter la maintenance et la cohérence des appels réseau. Tous les services API sont exportés depuis un point d'entrée unique : `app/services/api/index.ts`.

## Import des services API

### Méthode recommandée - Import nommé

```typescript
import { roadbookApi, sessionApi } from '../../services/api';

// Utilisation
const routes = await roadbookApi.getUserRoadbooks();
const sessions = await sessionApi.getUserSessions();
```

### Alternative - Import global

```typescript 
import api from '../../services/api';

// Utilisation
const routes = await api.roadbook.getUserRoadbooks();
const sessions = await api.session.getUserSessions();
```

## Exemple d'intégration dans my-routes.tsx

Voici comment vous pouvez intégrer les appels API dans votre page:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { roadbookApi } from '../../services/api';
import { logger } from '../../utils/logger';

export default function MyRoutesScreen() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel à l'API avec gestion des erreurs
      const userRoutes = await roadbookApi.getUserRoadbooks();
      setRoutes(userRoutes);
    } catch (error) {
      logger.error('Erreur lors du chargement des routes:', error);
      setError(error.message || 'Impossible de charger vos routes');
    } finally {
      setLoading(false);
    }
  };

  // Rendu du composant...
}
```

## Gestion des erreurs

Tous les services API incluent une gestion d'erreur sophistiquée:

```typescript
try {
  const result = await roadbookApi.createRoadbook(newRouteData);
  // Traiter le succès
} catch (error) {
  if (error.response?.status === 401) {
    // L'utilisateur n'est pas authentifié
    // Rediriger vers la page de connexion
  } else if (error.response?.status === 403) {
    // L'utilisateur n'a pas les permissions
    Alert.alert('Accès refusé', 'Vous n\'avez pas les droits pour effectuer cette action');
  } else if (!error.response) {
    // Erreur de connexion réseau
    Alert.alert('Erreur réseau', 'Vérifiez votre connexion internet');
  } else {
    // Autre erreur
    Alert.alert('Erreur', error.message || 'Une erreur est survenue');
  }
}
```

## Mode hors-ligne

Pour la gestion du mode hors-ligne, utilisez le sélecteur Redux:

```typescript
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from '../../store/slices/networkSlice';

export default function MyRoutes() {
  const isOnline = useSelector(selectIsInternetReachable);

  // Vérifier avant de faire des appels API
  const handleAction = async () => {
    if (!isOnline) {
      Alert.alert('Mode hors ligne', 'Cette action nécessite une connexion internet');
      return;
    }
    
    // Procéder avec l'appel API...
  };
}
```

## Endpoints API disponibles

Pour les routes et trajets:

- `roadbookApi.getUserRoadbooks()` - Récupérer tous les roadbooks de l'utilisateur
- `roadbookApi.getRoadbookById(id)` - Récupérer un roadbook spécifique
- `roadbookApi.createRoadbook(data)` - Créer un nouveau roadbook
- `roadbookApi.updateRoadbook(id, data)` - Mettre à jour un roadbook
- `roadbookApi.deleteRoadbook(id)` - Supprimer un roadbook

Pour les sessions:

- `sessionApi.getUserSessions()` - Récupérer toutes les sessions de l'utilisateur
- `sessionApi.startSession(data)` - Démarrer une nouvelle session
- `sessionApi.updateSession(id, data)` - Mettre à jour une session en cours
- `sessionApi.endSession(id, data)` - Terminer une session
- `sessionApi.deleteSession(id)` - Supprimer une session

## URL de l'API et environnement

Le client API est configuré pour pointer automatiquement vers le bon environnement:

- Production: `https://roadbook.onrender.com/api`
- Développement local: Configuration automatique selon la plateforme

Vous n'avez pas besoin de spécifier l'URL complète lors des appels API, tout est géré par le client API.