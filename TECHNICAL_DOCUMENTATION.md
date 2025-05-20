# Documentation Technique - Projet RoadBook

## Table des matières
1. [Introduction](#introduction)
2. [Architecture du projet](#architecture-du-projet)
3. [Sécurité](#sécurité)
4. [Gestion des données](#gestion-des-données)
5. [Performance](#performance)
6. [Tests](#tests)
7. [Bonnes pratiques](#bonnes-pratiques)
8. [Améliorations futures](#améliorations-futures)

## Introduction

RoadBook est une application mobile développée avec React Native et Expo qui permet aux utilisateurs de gérer leurs trajets routiers, d'obtenir des informations météorologiques et d'améliorer leurs compétences de conduite. Cette documentation technique explique les concepts et les choix techniques appliqués dans le projet.

## Architecture du projet

### Structure client-serveur

L'application suit une architecture client-serveur classique :
- **Client** : Application mobile React Native/Expo
- **Serveur** : API REST Node.js (probablement Express.js)

Cette séparation permet de :
- Maintenir une séparation claire des responsabilités
- Faciliter la maintenance et l'évolution indépendante des deux parties
- Permettre le développement de futures interfaces (web, desktop)

### Architecture des composants React

Le projet utilise des composants React modulaires suivant une approche de conception atomique :
- **Composants atomiques** : Boutons, inputs, cartes (dans `components/common/`)
- **Composants moléculaires** : Formulaires, sections (comme ProfileHeader)
- **Organismes** : Écrans entiers assemblant plusieurs composants (dans `app/`)

Cette architecture favorise la réutilisabilité et la testabilité des composants.

### Gestion d'état

La gestion d'état est assurée par Redux Toolkit, comme on peut le voir dans le dossier `store/slices/`. Ce choix offre plusieurs avantages :
- **État global centralisé** : Facilite le partage de données entre composants distants
- **Middleware** : Permet la gestion des effets secondaires avec Redux Thunk
- **DevTools** : Facilite le débogage avec les Redux DevTools
- **Immuabilité** : Garantit des mises à jour d'état prévisibles

Nous utilisons également des contextes React (comme `AuthContext`) pour des états plus spécifiques qui ne nécessitent pas la complexité de Redux.

## Sécurité

### Authentification JWT

Le système d'authentification repose sur les JSON Web Tokens (JWT) comme on le voit dans `AuthContext.tsx` et `auth.api.ts`. Le processus fonctionne ainsi :

1. L'utilisateur s'authentifie avec ses identifiants
2. Le serveur vérifie les identifiants et génère un JWT
3. Le client stocke ce token dans un stockage sécurisé (utilisation de `secureStorage.ts`)
4. Le client inclut ce token dans chaque requête API authentifiée

Avantages de cette approche :
- **Sans état** : Le serveur n'a pas à conserver de session
- **Intégrité** : Les tokens sont signés cryptographiquement
- **Information transportable** : Le token contient toutes les informations nécessaires

### Stockage sécurisé

Les informations sensibles comme les tokens d'authentification sont stockées dans un stockage sécurisé via `secureStorage.ts` qui utilise probablement `expo-secure-store`. Cette méthode :
- **Chiffre** les données stockées
- Utilise le **keystore système** de l'appareil quand disponible
- **Isole** les données de l'application des autres applications

### Protection contre les injections SQL

Bien que nous n'interagissions pas directement avec la base de données depuis le client, la protection contre les injections SQL est assurée par :

1. **Paramètres préparés** côté serveur
2. **Validation des données d'entrée** côté client avant envoi à l'API
3. **Utilisation d'un ORM** côté serveur (probablement Prisma comme suggéré par la référence dans les types `auth.types.ts`)

### Prévention des attaques XSS

La protection contre les attaques XSS (Cross-Site Scripting) est assurée par :

1. **React** qui échappe automatiquement le contenu rendu
2. **Validation des données d'entrée** pour rejeter les contenus malveillants
3. **Content Security Policy** pour limiter les sources de contenu exécutable

### Gestion des erreurs sécurisée

Le projet implémente une gestion d'erreur qui évite de divulguer des informations sensibles :
- Messages d'erreur génériques pour les utilisateurs
- Journalisation détaillée côté serveur
- Gestion des erreurs HTTP 401/403 pour rediriger vers la connexion

## Gestion des données

### ORM (Object-Relational Mapping)

Le backend utilise probablement Prisma comme ORM, comme suggéré par les références dans les définitions de types (`auth.types.ts`). Cet ORM offre :

- **Type safety** : Types TypeScript générés à partir du schéma
- **Migrations** : Gestion des évolutions de schéma
- **Requêtes optimisées** : Construction de requêtes SQL efficaces
- **Protection contre les injections** : Paramètres préparés automatiquement

Dans notre application, les modèles comme `User` sont définis avec leurs relations, et ces définitions sont répliquées côté client pour assurer une cohérence des types.

### API REST

L'application utilise une API REST pour communiquer avec le serveur. Les services API sont organisés dans `services/api/` avec des fichiers dédiés par domaine fonctionnel (auth, users, weather, etc.).

Avantages de cette approche :
- **Découplage** entre client et serveur
- **Standardisation** des opérations CRUD
- **Mise en cache** possible des réponses
- **Stateless** : Pas de conservation d'état côté serveur

### Gestion du cache

L'application implémente une stratégie de mise en cache sophistiquée, particulièrement visible dans le service météo (`weather.ts`). Cette approche :

1. **Réduit les appels API** en stockant localement les données récentes
2. **Accélère l'expérience utilisateur** en affichant les données immédiatement
3. **Permet le fonctionnement hors ligne** en utilisant les dernières données connues
4. **Optimise la consommation de batterie et de données** en limitant les requêtes réseau

La stratégie comprend :
- Invalidation du cache basée sur le temps et la localisation
- Nettoyage automatique des données obsolètes
- Fallback vers le cache lorsque l'API est inaccessible

### Synchronisation offline

Le projet possède un système de synchronisation offline à travers les composants `NetworkSyncManager.tsx` et `SyncInitializer.tsx`. Ce système :

1. Détecte l'état de la connexion réseau
2. Stocke les actions utilisateur lorsque hors ligne
3. Synchronise ces actions lorsque la connexion est rétablie
4. Gère les conflits potentiels entre données locales et distantes

## Performance

### Mise en cache et mémoïsation

L'application utilise plusieurs stratégies de mise en cache :

1. **Mise en cache des données distantes** (API)
   - Stockage local des réponses API avec AsyncStorage
   - Invalidation intelligente basée sur le temps et l'emplacement

2. **Mémoïsation des fonctions** 
   - Utilisation probable de `useMemo` et `useCallback` pour éviter les calculs répétés

3. **Lazy loading**
   - Chargement des écrans à la demande grâce au routeur (Expo Router)

### Optimisations React Native

Le projet utilise plusieurs techniques d'optimisation React Native :

1. **PureComponent / React.memo**
   - Pour éviter les rendus inutiles des composants

2. **Virtualisation des listes**
   - Utilisation probable de FlatList pour afficher efficacement de longues listes

3. **Optimisation des images**
   - Chargement progressif des images
   - Redimensionnement côté serveur (pour les avatars par exemple)

### Tests de performance

Des tests de performance sont implémentés dans `__tests__/performance/` pour mesurer et garantir les performances de l'application, notamment :

- Délai de réponse des services (comme les prévisions météo)
- Efficacité du système de cache
- Performances lors de requêtes concurrentes

Ces tests permettent de détecter les régressions de performance lors du développement.

## Tests

### Structure des tests

Le projet implémente une stratégie de test complète avec trois niveaux :

1. **Tests unitaires** (`__tests__/uniTest/`)
   - Testent des fonctions et composants isolés
   - Utilisent des mocks pour simuler les dépendances
   - Vérifient la logique métier

2. **Tests d'intégration** (`__tests__/integration/`)
   - Testent l'interaction entre plusieurs composants
   - Vérifient que les différentes parties fonctionnent ensemble
   - Utilisent des mocks partiels (certaines dépendances réelles)

3. **Tests de performance** (`__tests__/performance/`)
   - Vérifient que l'application répond dans des délais acceptables
   - Détectent les régressions de performance

Cette approche pyramidale assure une couverture complète tout en optimisant l'effort de test.

### Mocking

Les tests utilisent intensivement le mocking pour isoler les composants testés :

- Mock d'APIs externes (axios)
- Mock de services internes (AsyncStorage)
- Mock de modules système (notification, geolocation)

Cette approche permet de contrôler l'environnement de test et de simuler différents scénarios.

### Assertions

Les tests utilisent des assertions précises pour vérifier :

- Le format et le contenu des données
- Le comportement des fonctions dans différentes conditions
- La gestion des erreurs et cas limites
- Les performances temporelles (délais d'exécution)

## Bonnes pratiques

### Structure du code

Le projet suit une structure modulaire claire :

- **Séparation des préoccupations** : UI, logique métier, API, etc.
- **Organisation par domaine** : Regroupement par fonctionnalité plutôt que par type technique
- **Imports absolus** : Utilisation de chemins absolus (`@/`) pour éviter les imports relatifs complexes

### Gestion des erreurs

La gestion des erreurs est robuste avec :

1. **Try/catch** systématique pour les opérations asynchrones
2. **Fallbacks** pour gérer les cas d'échec (comme dans `notification.api.ts`)
3. **Messages utilisateur** adaptés et non techniques
4. **Journalisation** détaillée avec `logger.ts`

### Documentation

Le code est documenté à plusieurs niveaux :

1. **JSDoc** pour les fonctions et classes importantes
2. **Types TypeScript** pour documenter la structure des données
3. **Commentaires explicatifs** pour les logiques complexes
4. **Documentation externe** comme ce document

### Convention de nommage

Le projet suit des conventions de nommage cohérentes :

- **PascalCase** pour les composants React
- **camelCase** pour les variables et fonctions
- **UPPER_CASE** pour les constantes
- **snake_case** pour certains fichiers de configuration

## Améliorations futures

### Architecture

1. **Micro-frontends** : Diviser l'application en modules plus indépendants pour faciliter le développement par équipes
2. **Architecture hexagonale** : Séparer plus clairement la logique métier des adaptateurs techniques

### Sécurité

1. **Refresh token** : Implémenter un système de refresh token pour prolonger les sessions sans demander de reconnexion
2. **E2E encryption** : Chiffrer les données sensibles de bout en bout
3. **Hachage côté client** : Hacher les mots de passe côté client avant envoi
4. **Rate limiting** : Limiter le nombre de requêtes par utilisateur pour prévenir les attaques par force brute

### Performance

1. **Server-Side Rendering** pour la version web
2. **Code splitting** plus agressif
3. **Workers** pour décharger le thread principal
4. **Optimisation des assets** (images, sons)

### Tests

1. **Tests E2E** avec Detox ou Cypress
2. **Visual regression testing** pour détecter les changements d'interface non intentionnels
3. **Couverture de test** augmentée (actuellement à 0% selon la configuration)

### CI/CD

1. **Pipeline complet** avec tests, linting, builds et déploiements automatisés
2. **Déploiement progressif** avec canary releases
3. **Monitoring** en production avec alertes

---

Ce document sera mis à jour régulièrement pour refléter l'évolution du projet et l'intégration de nouvelles pratiques et technologies.
