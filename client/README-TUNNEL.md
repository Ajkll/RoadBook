# Configuration du tunnel Expo pour l'API

Ce guide explique comment configurer le tunnel Expo pour que votre application mobile puisse communiquer avec votre backend, même à travers différents réseaux.

## Problème résolu

Quand vous développez avec Expo:
- Sur le web, l'application peut accéder directement à localhost
- Sur Android/iOS, l'application ne peut pas accéder à localhost ou 127.0.0.1 de votre machine
- Les adresses IP standard comme 10.0.2.2 (émulateur Android) ne fonctionnent pas toujours

## Solution: Le tunnel Expo

Notre solution utilise l'URL du tunnel Expo pour configurer dynamiquement les URLs de l'API selon la plateforme.

## Comment l'utiliser

### 1. Démarrer les serveurs

```bash
# Terminal 1: backend
cd server
npm run dev

# Terminal 2: client avec tunnel Expo
cd client
npx expo start --tunnel
```

### 2. Noter l'URL du tunnel

Lorsque Expo démarre avec l'option `--tunnel`, vous verrez une URL comme:
```
› Tunnel ready.
› exp://u4-bs1.anonymous.roadbook.exp.direct:80
```

C'est cette URL dont vous avez besoin.

### 3. Configurer l'application

#### Option A: Utiliser l'écran API Test

1. Lancez l'application sur votre appareil
2. Naviguez vers l'onglet "API Test"
3. Entrez l'URL du tunnel (qui commence par `exp://`)
4. Appuyez sur "Mettre à jour URL Expo"
5. Testez la connexion avec les endpoints

#### Option B: Configuration permanente

1. Créez un fichier `.env.local` dans le dossier client:
   ```
   EXPO_PUBLIC_API_URL=exp://votre-url-tunnel-expo
   ```
2. Redémarrez votre application Expo

## Comment ça fonctionne

Notre client API utilise un système intelligent qui:
1. Sur le web: Utilise directement localhost
2. Sur mobile avec URL Expo configurée: Utilise le tunnel
3. Sur mobile sans URL Expo: Fallback vers les adresses traditionnelles (10.0.2.2, etc.)

Essayez d'abord sur le web, puis sur mobile avec le tunnel configuré!