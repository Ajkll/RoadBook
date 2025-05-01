# Configuration API centralisée

Ce guide explique comment l'application RoadBook gère les connexions API sur différentes plateformes et en mode tunnel.

## Le problème

Lorsque vous développez une application React Native/Expo, chaque plateforme et contexte a une façon différente d'accéder à votre serveur backend:

- **Web**: Peut utiliser `localhost` directement
- **iOS Simulator**: Peut utiliser `localhost`
- **Android Emulator**: Doit utiliser `10.0.2.2` (adresse spéciale qui pointe vers l'hôte)
- **Appareils physiques en mode tunnel**: Besoin d'une URL accessible publiquement

## Notre solution centralisée

Nous avons créé une configuration API centralisée dans `client.ts` qui:

1. Est la SOURCE UNIQUE DE VÉRITÉ pour toutes les URL API
2. Détecte automatiquement la plateforme (web, Android, iOS)
3. Détecte automatiquement si l'application est en mode tunnel Expo
4. Configure la bonne URL API pour chaque environnement
5. Est utilisée par tous les autres modules (auth.api.ts, roadbook.api.ts, api-proxy.ts)

## URLs par environnement

| Environnement | URL API |
|------------|---------|
| Web | `http://localhost:4002/api` |
| iOS Simulator | `http://localhost:4002/api` |
| Android Emulator | `http://10.0.2.2:4002/api` |
| Mode Tunnel/Appareil physique | `https://yanstart-rainy-space-5rgx6q6xqpw367r5-4002.preview.app.github.dev/api` |

## Architecture de l'API

```
services/api/client.ts (SOURCE UNIQUE DE VÉRITÉ)
  ↓
  ├── services/api/auth.api.ts (utilise apiClient de client.ts)
  ├── services/api/roadbook.api.ts (utilise apiClient de client.ts)
  └── api-proxy.ts (utilise API_URL de client.ts)
```

## Détection du mode tunnel

L'application détecte automatiquement si elle est en mode tunnel Expo en vérifiant:

1. Si Constants.expoConfig.hostUri contient "tunnel"
2. Si l'URI ne contient pas "localhost" ou "127.0.0.1"

Quand l'application est en mode tunnel, elle utilisera automatiquement l'URL GitHub Codespace qui est accessible publiquement.

## Utilisation dans votre code

Pour utiliser cette configuration dans votre code:

```typescript
// Importer l'API client centralisé
import apiClient, { API_URL, TUNNEL_MODE } from './services/api/client';

// Faire des requêtes API avec apiClient
const response = await apiClient.get('/users/me');

// OU utiliser l'API proxy qui utilise également la même configuration
import { apiProxy } from './api-proxy';
const url = apiProxy.getUrl('/users/me');
```

## Écran de test API

L'application inclut un écran de test API (`app/(tabs)/api-test.tsx`) qui permet de:

1. Voir la configuration API actuelle (y compris le mode tunnel)
2. Tester les différents endpoints
3. Tester directement l'URL GitHub Codespace
4. Vérifier la connexion au serveur

Utilisez cet écran pour diagnostiquer les problèmes de connexion.

## Personnalisation

Pour modifier la configuration API:

1. Modifiez uniquement le fichier `app/services/api/client.ts`
2. Tous les autres fichiers prendront automatiquement en compte vos changements