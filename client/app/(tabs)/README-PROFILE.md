# Architecture du module de profil utilisateur

Ce document explique l'architecture et l'utilisation du module de profil utilisateur dans l'application RoadBook.

## Structure actuelle

L'écran de profil est actuellement structuré de deux façons:

1. **Composant monolithique:** 
   - Fichier: `/app/(tabs)/profile.tsx`
   - Ce composant gère toutes les fonctionnalités du profil dans un seul fichier volumineux.
   - Il utilise un état interne `activeScreen` pour basculer entre différentes vues (profil principal, édition, mot de passe, etc.)
   - Il est intégré au `UserContext` pour une meilleure gestion des données utilisateur.

2. **Architecture modulaire (en développement):**
   - Dossier: `/app/(tabs)/profile/`
   - Contient plusieurs fichiers pour chaque fonctionnalité (index.tsx, edit.tsx, change-password.tsx, etc.)
   - Utilise un `_layout.tsx` pour la mise en page commune

## Le UserContext

Le `UserContext` a été implémenté pour centraliser la gestion des données utilisateur et résoudre les problèmes de stockage:

1. **Centralisation des données:**
   - Toutes les données utilisateur sont stockées dans un seul endroit
   - Résistant aux problèmes de stockage grâce à des mécanismes de secours
   - Conserve les données en mémoire même en cas de problèmes de connectivité

2. **Fonctionnalités principales:**
   - `refreshUserData()`: Recharge les données utilisateur depuis le serveur
   - `updateUserProfile()`: Met à jour les informations du profil
   - `updateUserAvatar()`: Met à jour l'avatar de l'utilisateur
   - `loadUserStats()`: Charge les statistiques utilisateur
   - `loadUserActivity()`: Charge l'activité récente

## Gestion des routes et de la navigation

Actuellement, la navigation est configurée pour utiliser le fichier `profile.tsx` comme point d'entrée principal (dans `app/(tabs)/_layout.tsx`).

Pour naviguer vers une sous-page (si vous décidez d'utiliser l'architecture modulaire), utilisez:

```tsx
router.push('/(tabs)/profile/edit')
router.push('/(tabs)/profile/change-password')
router.push('/(tabs)/profile/sessions')
router.push('/(tabs)/profile/delete-account')
```

## Stratégie d'amélioration progressive

Pour améliorer progressivement cette architecture sans casser la fonctionnalité existante:

1. **Court terme (actuel):**
   - Continuez à utiliser `profile.tsx` comme point d'entrée principal
   - Intégrez progressivement le `UserContext` pour améliorer la gestion des données

2. **Moyen terme:**
   - Extraire progressivement des fonctionnalités vers des composants séparés
   - Utiliser les composants du dossier `profile/` pour un code plus modulaire

3. **Long terme:**
   - Migrer complètement vers l'architecture modulaire 
   - Mettre à jour la configuration des onglets pour utiliser le dossier `profile/` directement

## Conseils d'utilisation

1. **Récupération des données utilisateur:**
   ```tsx
   import { useUser } from '../../context/UserContext';

   function MyComponent() {
     const { userData, refreshUserData } = useUser();
     
     // Utilisez userData pour accéder aux informations utilisateur
     return <Text>{userData?.displayName}</Text>;
   }
   ```

2. **Mise à jour du profil:**
   ```tsx
   const { updateUserProfile } = useUser();
   
   // Exemple de mise à jour
   await updateUserProfile({
     displayName: 'Nouveau nom',
     phoneNumber: '0123456789'
   });
   ```

3. **Mise à jour de l'avatar:**
   ```tsx
   const { updateUserAvatar } = useUser();
   
   // Après avoir sélectionné une image
   await updateUserAvatar(imageUri);
   ```

## Dépannage

En cas de problèmes avec le profil:

1. Vérifiez l'initialisation du `UserContext` dans `_layout.tsx`
2. Vérifiez les logs pour les erreurs liées au stockage sécurisé
3. Assurez-vous que les routes sont correctement configurées dans la navigation

Si les problèmes persistent, essayez de revenir à l'implémentation simple dans `profile.tsx` en désactivant l'intégration avec `UserContext`.