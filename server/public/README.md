# RoadBook API Test UI

Cette interface utilisateur permet de tester facilement les différentes fonctionnalités de l'API RoadBook en mode développement.

## Présentation

L'interface est conçue selon une approche modulaire qui reflète l'architecture du back-end, permettant de tester chaque module fonctionnel indépendamment :

1. **Module Authentification** - Gestion des utilisateurs et tokens
2. **Module Utilisateurs** - Profils et administration
3. **Module RoadBooks** - Carnets d'apprentissage
4. **Module Sessions** - Sessions de conduite
5. **Module API Debug** - Console pour visualiser les réponses API

## Installation

L'interface est automatiquement disponible lors du lancement du serveur de développement avec la commande :

```bash
./launch-dev.sh
```

Cette commande démarre à la fois :
- Le serveur API principal sur le port 4002
- Le serveur de test sur le port 4001
- Prisma Studio sur le port 5555

## Utilisation

Accédez à l'interface à l'adresse : http://localhost:4001

### Fonctionnalités principales

1. **Test d'authentification**
   - Inscription d'un nouvel utilisateur
   - Connexion avec un compte existant
   - Gestion et rafraîchissement des tokens
   - Réinitialisation de mot de passe

2. **Gestion des utilisateurs**
   - Consultation de son profil
   - Mise à jour des informations personnelles
   - Changement de mot de passe
   - Administration des utilisateurs (admin uniquement)

3. **Gestion des RoadBooks**
   - Création de nouveaux carnets d'apprentissage
   - Consultation des RoadBooks existants
   - Modification du statut
   - Assignation d'un guide

4. **Gestion des sessions**
   - Création de sessions de conduite
   - Consultation des sessions existantes
   - Informations détaillées (durée, conditions, etc.)

## Utilisateurs de test

Les comptes suivants sont déjà configurés dans l'environnement de développement :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `apprentice@roadbook.com` | `Password123!` | APPRENTICE |
| `guide@roadbook.com` | `Password123!` | GUIDE |
| `instructor@roadbook.com` | `Password123!` | INSTRUCTOR |
| `admin@roadbook.com` | `Password123!` | ADMIN |

## Architecture

Cette interface a été conçue avec une approche modulaire similaire au back-end :

- Interface utilisateur moderne avec CSS personnalisé
- Gestion des appels API via JavaScript
- Stockage des tokens en localStorage
- Présentation des données dans un format facile à lire

## Développement

Les fichiers principaux sont :

- `index.html` - Structure et styles de l'interface
- `app.js` - Logique JavaScript et appels API

Pour ajouter de nouveaux modules :
1. Créer une nouvelle section dans `index.html`
2. Ajouter les fonctions correspondantes dans `app.js`
3. Mettre à jour la navigation dans la barre supérieure

## Dépannage

- Si l'interface ne se charge pas, vérifiez que le serveur de test est bien lancé
- En cas d'erreur d'API, consultez le module "API Debug" pour voir les détails
- Pour les problèmes d'authentification, essayez de vous déconnecter et reconnecter