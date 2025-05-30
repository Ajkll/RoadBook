# Guide de Déploiement de RoadBook Server

Ce document décrit l'infrastructure Docker de RoadBook Server et explique comment déployer l'application sur un serveur Kali Linux.

## Table des Matières

1. [Architecture de l'Infrastructure](#architecture-de-linfrastructure)
2. [Prérequis](#prérequis)
3. [Déploiement Rapide](#déploiement-rapide)
4. [Configuration du DNS](#configuration-du-dns)
5. [Certificats SSL](#certificats-ssl)
6. [Structure des Fichiers](#structure-des-fichiers)
7. [Configuration Personnalisée](#configuration-personnalisée)
8. [Dépannage](#dépannage)

## Architecture de l'Infrastructure

L'infrastructure se compose des services suivants :

```
                        ┌─────────────┐
                        │   Internet  │
                        └──────┬──────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────┐
│                     Nginx (443, 80)                 │
│   Reverse Proxy avec SSL Termination & Load Balancer│
└───┬─────────────────────────────────────────┬──────┘
    │                                         │
    ▼                                         ▼
┌──────────────────┐                 ┌──────────────────┐
│   API Node.js    │                 │  API de Test     │
│    (Port 4000)   │                 │   (Port 4001)    │
└────────┬─────────┘                 └─────────┬────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌─────────────────────────────────────────────────────┐
│              Base de données PostgreSQL             │
└─────────────────────────────────────────────────────┘
```

### Services

- **Nginx**: Reverse proxy qui gère le trafic HTTPS, les certificats SSL, et route les requêtes vers les bonnes API.
- **API Node.js**: Service principal qui exécute l'application RoadBook en mode production.
- **API de Test**: Instance séparée de l'API qui exécute l'interface de test API.
- **PostgreSQL**: Base de données relationnelle pour stocker toutes les données de l'application.
- **Certbot**: Service de renouvellement automatique des certificats SSL Let's Encrypt.

## Prérequis

- Serveur Kali Linux
- Docker et Docker Compose installés
- Nom de domaine pointant vers votre serveur (pour HTTPS)
- Ports 80 et 443 ouverts sur votre serveur

## Déploiement Rapide

Le déploiement est automatisé via le script `deploy.sh`. Pour déployer l'application :

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-repo/roadbook.git
   cd roadbook/server
   ```

2. Lancez le script de déploiement :
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. Suivez les instructions à l'écran pour configurer :
   - Le nom de domaine principal (par défaut : bephec.org)
   - L'adresse email pour Let's Encrypt
   - Les certificats SSL

Le script effectue automatiquement :
- La vérification des prérequis (Docker, Docker Compose)
- La création d'un fichier `.env` avec des valeurs sécurisées générées aléatoirement
- La vérification de la configuration DNS
- La mise à jour des configurations Nginx avec vos domaines
- Le déploiement des conteneurs Docker
- L'obtention des certificats SSL (si demandé)

## Configuration du DNS

Le déploiement inclut un serveur DNS Bind9 qui agit comme serveur autoritaire pour votre domaine. Cela vous permet de gérer entièrement vos enregistrements DNS sans dépendre d'un fournisseur tiers pour les modifications de sous-domaines.

### Comment fonctionne notre configuration DNS

1. **Serveur DNS Bind9 autoritaire** : Le conteneur `dns` exécute Bind9 configuré pour être autoritaire pour le domaine `bephec.org` (ou le domaine que vous spécifiez).

2. **Zones DNS configurées automatiquement** : Les fichiers de zone sont générés avec l'adresse IP de votre serveur pendant le déploiement.

3. **Sous-domaines préconfigurés** :
   - `api.votre-domaine.com` → Pointe vers votre serveur (API principale)
   - `test.votre-domaine.com` → Pointe vers votre serveur (API de test)
   - `ns1.votre-domaine.com` → Pointe vers votre serveur (Serveur de noms)
   - `www.votre-domaine.com` → Pointe vers votre serveur
   - Et d'autres sous-domaines utiles comme `dev` et `staging`

### Configuration chez votre registrar (Namecheap)

Pour utiliser votre propre serveur DNS avec le domaine, vous devez effectuer les configurations suivantes chez Namecheap (ou tout autre registrar) :

1. Accédez à la gestion du domaine et configurez les enregistrements suivants :
   ```
   Type    Hôte    Valeur               TTL
   A       @       [IP_de_votre_serveur] Automatic
   A       www     [IP_de_votre_serveur] Automatic
   A       ns1     [IP_de_votre_serveur] Automatic
   NS      @       ns1.votre-domaine.com Automatic
   ```

2. Ces configurations délèguent l'autorité DNS à votre serveur, qui sera alors responsable de tous les sous-domaines.

3. Une fois la propagation DNS terminée (jusqu'à 48 heures), tous les sous-domaines seront automatiquement gérés par votre serveur.

### Ajout de nouveaux sous-domaines

Pour ajouter un nouveau sous-domaine après le déploiement :

1. Connectez-vous à votre serveur
2. Modifiez le fichier de zone : `nano /workspaces/RoadBook/server/dns/zones/db.votre-domaine.com`
3. Ajoutez votre enregistrement : `nouveau-sous-domaine IN A [IP_du_serveur]`
4. Incrémentez le numéro de série dans l'enregistrement SOA
5. Redémarrez le conteneur DNS : `docker-compose restart dns`

### Vérification de la configuration DNS

Pour vérifier que votre serveur DNS fonctionne correctement :

```bash
# Depuis un autre ordinateur
dig @[IP_de_votre_serveur] api.votre-domaine.com
dig @[IP_de_votre_serveur] test.votre-domaine.com
```

Vous devriez voir l'adresse IP de votre serveur dans les réponses.

## Certificats SSL

Les certificats SSL sont gérés par Let's Encrypt via Certbot. Le script `init-letsencrypt.sh` est utilisé pour obtenir les certificats initiaux et configurer le renouvellement automatique.

Si vous n'avez pas configuré les certificats lors du déploiement initial, vous pouvez les configurer ultérieurement :

```bash
./init-letsencrypt.sh
```

Les certificats sont automatiquement renouvelés tous les 12 heures (si nécessaire) par le conteneur Certbot.

## Structure des Fichiers

```
server/
├── Dockerfile              # Image Docker pour l'API Node.js
├── docker-compose.yml      # Configuration des services
├── deploy.sh               # Script de déploiement automatisé
├── init-letsencrypt.sh     # Script d'initialisation des certificats SSL
├── nginx/
│   ├── nginx.conf          # Configuration générale de Nginx
│   └── conf.d/
│       └── default.conf    # Configuration des hôtes virtuels
├── dns/
│   ├── named.conf          # Fichier principal de configuration Bind9
│   ├── named.conf.options  # Options globales pour Bind9
│   ├── named.conf.local    # Configuration des zones locales
│   └── zones/              # Fichiers de zone pour les domaines
│       ├── db.bephec.org   # Zone pour le domaine principal
│       └── db.192.168.0    # Zone inverse pour le réseau local
└── .env                    # Variables d'environnement (créé par deploy.sh)
```

## Configuration Personnalisée

### Variables d'Environnement

Le fichier `.env` contient toutes les variables d'environnement utilisées par les conteneurs. Vous pouvez le modifier manuellement après sa création :

```
NODE_ENV=production
API_PORT=4000
TEST_API_PORT=4001
DB_USER=postgres
DB_PASS=<mot_de_passe_généré>
DB_NAME=roadbook
JWT_SECRET=<secret_généré>
JWT_REFRESH_SECRET=<secret_généré>
DOMAIN_NAME=bephec.org
API_DOMAIN=api.bephec.org
TEST_DOMAIN=test.bephec.org
CORS_ORIGINS=https://api.bephec.org,https://test.bephec.org,http://localhost:19000,...
SEED_DATABASE=true
LETSENCRYPT_EMAIL=votre.email@example.com
```

### Nginx

Pour personnaliser la configuration de Nginx, modifiez les fichiers dans le répertoire `nginx/` avant de lancer le déploiement.

### PostgreSQL

Les données PostgreSQL sont stockées dans un volume Docker nommé `roadbook-postgres-data`, ce qui garantit la persistance des données entre les redémarrages.

Pour se connecter à la base de données depuis l'extérieur des conteneurs :

```bash
docker exec -it roadbook-postgres psql -U postgres -d roadbook
```

## Dépannage

### Vérifier les Logs

Pour voir les logs des conteneurs :

```bash
# Tous les logs
docker-compose logs

# Logs d'un service spécifique
docker-compose logs api
docker-compose logs nginx
```

### Problèmes Courants

#### Les certificats SSL ne sont pas obtenus

1. Vérifiez que vos domaines pointent correctement vers votre serveur :
   ```bash
   dig +short api.votre-domaine.com
   dig +short test.votre-domaine.com
   ```

2. Assurez-vous que les ports 80 et 443 sont ouverts :
   ```bash
   nmap -p 80,443 votre-domaine.com
   ```

#### L'API n'est pas accessible

1. Vérifiez que les conteneurs sont en cours d'exécution :
   ```bash
   docker-compose ps
   ```

2. Vérifiez les logs de l'API :
   ```bash
   docker-compose logs api
   ```

#### Problèmes de base de données

1. Vérifiez que PostgreSQL est en cours d'exécution :
   ```bash
   docker-compose ps postgres
   ```

2. Vérifiez les logs de PostgreSQL :
   ```bash
   docker-compose logs postgres
   ```

3. Vérifiez la connexion à la base de données :
   ```bash
   docker exec -it roadbook-postgres pg_isready -h localhost -U postgres
   ```

---

Pour toute assistance supplémentaire, veuillez créer une issue sur le dépôt GitHub ou contacter l'équipe de développement.