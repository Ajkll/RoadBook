#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages avec des couleurs
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier si Docker est installé
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé. Veuillez l'installer avant de continuer."
        log_info "Installation de Docker: https://docs.docker.com/engine/install/"
        exit 1
    else
        log_success "Docker est installé: $(docker --version)"
    fi
    
    # Vérifier si Docker Compose est installé
    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose n'est pas installé. Tentative d'installation..."
        
        # Installation de Docker Compose
        sudo apt-get update
        sudo apt-get install -y docker-compose-plugin
        
        if ! command -v docker-compose &> /dev/null; then
            log_error "Impossible d'installer Docker Compose. Veuillez l'installer manuellement."
            log_info "Installation de Docker Compose: https://docs.docker.com/compose/install/"
            exit 1
        fi
    fi
    
    log_success "Docker Compose est installé: $(docker-compose --version)"
    
    # Vérifier si l'utilisateur peut exécuter Docker sans sudo
    if ! docker info &> /dev/null; then
        log_warning "L'utilisateur actuel ne peut pas exécuter Docker sans sudo."
        log_info "Ajout de l'utilisateur au groupe docker..."
        
        sudo groupadd -f docker
        sudo usermod -aG docker $USER
        
        log_warning "Un redémarrage de la session peut être nécessaire pour appliquer les changements."
        log_info "Après redémarrage, exécutez à nouveau ce script."
        
        read -p "Voulez-vous continuer avec sudo pour cette session? (o/n): " choice
        if [[ "$choice" != "o" && "$choice" != "O" ]]; then
            exit 1
        fi
    else
        log_success "L'utilisateur peut exécuter Docker sans sudo."
    fi
    
    # Vérifier si dnsutils est installé (pour les commandes DNS)
    if ! command -v dig &> /dev/null; then
        log_warning "dnsutils n'est pas installé. Tentative d'installation..."
        sudo apt-get update
        sudo apt-get install -y dnsutils
        
        if ! command -v dig &> /dev/null; then
            log_error "Impossible d'installer dnsutils. Certaines fonctionnalités DNS peuvent ne pas fonctionner."
        else
            log_success "dnsutils installé avec succès."
        fi
    else
        log_success "dnsutils est installé."
    fi
}

# Création du fichier .env pour les variables d'environnement
create_env_file() {
    log_info "Configuration des variables d'environnement..."
    
    # Vérifier si le fichier .env existe déjà
    if [ -f .env ]; then
        log_warning "Un fichier .env existe déjà."
        read -p "Voulez-vous le remplacer? (o/n): " choice
        if [[ "$choice" != "o" && "$choice" != "O" ]]; then
            log_info "Utilisation du fichier .env existant."
            return
        fi
    fi
    
    # Générer des secrets aléatoires
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    DB_PASS=$(openssl rand -base64 12)
    
    # Demander le nom de domaine principal ou utiliser la valeur par défaut
    read -p "Entrez le nom de domaine principal (par défaut: bephec.org): " DOMAIN_NAME
    DOMAIN_NAME=${DOMAIN_NAME:-bephec.org}
    
    # Créer le fichier .env
    cat > .env <<EOL
# Variables d'environnement pour le déploiement RoadBook

# Mode d'environnement (production ou development)
NODE_ENV=production

# Ports exposés
API_PORT=4000
TEST_API_PORT=4001

# Configuration de la base de données
DB_USER=postgres
DB_PASS=$DB_PASS
DB_NAME=roadbook

# Secrets pour JWT
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Domaine principal
DOMAIN_NAME=$DOMAIN_NAME
API_DOMAIN=api.$DOMAIN_NAME
TEST_DOMAIN=test.$DOMAIN_NAME

# Origines CORS autorisées (séparées par des virgules)
CORS_ORIGINS=https://api.$DOMAIN_NAME,https://test.$DOMAIN_NAME,http://localhost:19000,http://localhost:19006,http://localhost:3000,exp://localhost:19000

# Peupler la base de données au démarrage (true/false)
SEED_DATABASE=true

# Email pour Let's Encrypt
LETSENCRYPT_EMAIL=votre.email@example.com
EOL
    
    log_success "Fichier .env créé avec succès."
    
    # Demander l'email pour Let's Encrypt
    read -p "Entrez votre adresse email pour Let's Encrypt (pour les notifications sur les certificats): " LETSENCRYPT_EMAIL
    if [ ! -z "$LETSENCRYPT_EMAIL" ]; then
        sed -i "s/votre.email@example.com/$LETSENCRYPT_EMAIL/" .env
        log_success "Email mis à jour dans le fichier .env."
    fi
}

# Configuration des domaines DNS
configure_dns() {
    log_info "Configuration du serveur DNS pour le domaine $DOMAIN_NAME..."

    # Charger les variables d'environnement
    if [ -f .env ]; then
        source .env
    else
        log_error "Le fichier .env n'existe pas. Exécutez d'abord create_env_file."
        exit 1
    fi

    # Obtenir l'adresse IP publique du serveur
    SERVER_IP=$(curl -s https://api.ipify.org)
    log_info "Adresse IP du serveur: $SERVER_IP"

    # Vérifier si le répertoire DNS existe
    if [ ! -d "./dns" ]; then
        log_info "Création des répertoires pour la configuration DNS..."
        mkdir -p ./dns/zones
    fi

    # Mise à jour des fichiers de configuration DNS avec l'adresse IP du serveur
    log_info "Création des fichiers de configuration DNS..."

    # Vérifier et créer named.conf si nécessaire
    if [ ! -f "./dns/named.conf" ]; then
        cat > ./dns/named.conf <<EOF
// Fichier de configuration principal de Bind9
include "/etc/bind/named.conf.options";
include "/etc/bind/named.conf.local";
EOF
    fi

    # Créer named.conf.options
    cat > ./dns/named.conf.options <<EOF
options {
    directory "/var/cache/bind";

    // Si ce serveur est le DNS principal pour votre domaine
    recursion yes;
    allow-recursion { any; };

    // Forwarding vers Google et Cloudflare DNS si une requête ne peut pas être résolue localement
    forwarders {
        8.8.8.8;
        8.8.4.4;
        1.1.1.1;
        1.0.0.1;
    };

    // DNSSEC
    dnssec-validation auto;

    // IPv6
    listen-on-v6 { any; };

    // Écouter sur toutes les interfaces
    listen-on { any; };

    // Permettre les requêtes de n'importe où (pour l'environnement de production,
    // vous pourriez vouloir restreindre cela)
    allow-query { any; };

    // Journal des requêtes pour le débogage
    querylog yes;
};
EOF

    # Créer named.conf.local
    cat > ./dns/named.conf.local <<EOF
// Configuration des zones locales pour le domaine $DOMAIN_NAME

// Zone principale pour $DOMAIN_NAME
zone "$DOMAIN_NAME" {
    type master;
    file "/etc/bind/zones/db.$DOMAIN_NAME";
    allow-transfer { none; };
    allow-update { none; };
};

// Zone de résolution inverse (pour les IP internes seulement)
zone "0.168.192.in-addr.arpa" {
    type master;
    file "/etc/bind/zones/db.192.168.0";
    allow-transfer { none; };
    allow-update { none; };
};
EOF

    # Créer le fichier de zone pour le domaine
    TS=$(date +%Y%m%d%H)
    cat > ./dns/zones/db.$DOMAIN_NAME <<EOF
; Zone file for $DOMAIN_NAME
\$TTL    3600
@       IN      SOA     ns1.$DOMAIN_NAME. admin.$DOMAIN_NAME. (
                        $TS      ; Serial
                        3600            ; Refresh
                        1800            ; Retry
                        604800          ; Expire
                        86400 )         ; Negative Cache TTL

; Serveurs de noms (NS records)
@       IN      NS      ns1.$DOMAIN_NAME.

; Serveur de noms - Adresse A
ns1     IN      A       $SERVER_IP

; Mail Exchanger (MX record)
@       IN      MX      10      mail.$DOMAIN_NAME.
mail    IN      A       $SERVER_IP

; Adresses du domaine principal
@       IN      A       $SERVER_IP
www     IN      A       $SERVER_IP

; Sous-domaines pour l'API et l'interface de test
api     IN      A       $SERVER_IP
test    IN      A       $SERVER_IP

; Autres sous-domaines éventuels
dev     IN      A       $SERVER_IP
staging IN      A       $SERVER_IP
EOF

    # Créer le fichier de zone de résolution inverse
    cat > ./dns/zones/db.192.168.0 <<EOF
; Reverse lookup file for 192.168.0.0/24
\$TTL    3600
@       IN      SOA     ns1.$DOMAIN_NAME. admin.$DOMAIN_NAME. (
                        $TS      ; Serial
                        3600            ; Refresh
                        1800            ; Retry
                        604800          ; Expire
                        86400 )         ; Negative Cache TTL

; Serveurs de noms
@       IN      NS      ns1.$DOMAIN_NAME.

; Résolutions inverses pour les adresses IP internes
; Format: Dernier octet de l'adresse IP  PTR  nom_d'hôte.domaine.
10      IN      PTR     server.$DOMAIN_NAME.
EOF

    # Donner les permissions appropriées aux fichiers
    chmod -R 755 ./dns

    log_success "Configuration DNS créée avec succès pour le domaine $DOMAIN_NAME."

    # Informations sur les modifications DNS à faire chez le registrar
    log_info "Instructions pour la configuration DNS chez votre registrar (Namecheap):"
    echo "-------------------------------------------------------------"
    echo "1. Connectez-vous à votre compte Namecheap"
    echo "2. Accédez à la gestion DNS de votre domaine $DOMAIN_NAME"
    echo "3. Configurez les serveurs de noms personnalisés (Custom DNS) pour pointer vers votre serveur:"
    echo "   - Pour Oracle Cloud, configurez les enregistrements suivants:"
    echo ""
    echo "   Type    Hôte    Valeur               TTL"
    echo "   A       @       $SERVER_IP           Automatic"
    echo "   A       www     $SERVER_IP           Automatic"
    echo "   A       ns1     $SERVER_IP           Automatic"
    echo "   NS      @       ns1.$DOMAIN_NAME     Automatic"
    echo ""
    echo "4. Attendez que les modifications DNS se propagent (peut prendre jusqu'à 48h)"
    echo "-------------------------------------------------------------"

    read -p "Avez-vous configuré les enregistrements DNS comme indiqué ci-dessus? (o/n): " dns_choice
    if [[ "$dns_choice" != "o" && "$dns_choice" != "O" ]]; then
        log_warning "La configuration DNS est nécessaire pour le bon fonctionnement du serveur."
        log_info "Vous pouvez continuer sans configuration DNS correcte, mais les certificats SSL ne pourront pas être obtenus automatiquement."
        read -p "Voulez-vous continuer quand même? (o/n): " continue_choice
        if [[ "$continue_choice" != "o" && "$continue_choice" != "O" ]]; then
            exit 1
        fi
    fi
}

# Mise à jour des fichiers de configuration Nginx avec les domaines
update_nginx_config() {
    log_info "Mise à jour des configurations Nginx avec les domaines..."
    
    # Charger les variables d'environnement
    if [ -f .env ]; then
        source .env
    else
        log_error "Le fichier .env n'existe pas. Exécutez d'abord create_env_file."
        exit 1
    fi
    
    # Mettre à jour le fichier default.conf avec les domaines
    if [ -f ./nginx/conf.d/default.conf ]; then
        sed -i "s/api.bephec.org/$API_DOMAIN/g" ./nginx/conf.d/default.conf
        sed -i "s/test.bephec.org/$TEST_DOMAIN/g" ./nginx/conf.d/default.conf
        log_success "Configuration Nginx mise à jour avec les domaines: $API_DOMAIN et $TEST_DOMAIN."
    else
        log_warning "Le fichier nginx/conf.d/default.conf n'existe pas."
    fi
    
    # Mettre à jour le script init-letsencrypt.sh avec les domaines
    if [ -f ./init-letsencrypt.sh ]; then
        sed -i "s/api.bephec.org/$API_DOMAIN/g" ./init-letsencrypt.sh
        sed -i "s/test.bephec.org/$TEST_DOMAIN/g" ./init-letsencrypt.sh
        sed -i "s/votre.email@example.com/$LETSENCRYPT_EMAIL/g" ./init-letsencrypt.sh
        chmod +x ./init-letsencrypt.sh
        log_success "Script init-letsencrypt.sh mis à jour avec les domaines et l'email."
    else
        log_warning "Le fichier init-letsencrypt.sh n'existe pas."
    fi
}

# Déploiement des conteneurs
deploy_containers() {
    log_info "Déploiement des conteneurs Docker..."
    
    # Arrêter et supprimer les conteneurs existants
    log_info "Arrêt des conteneurs existants..."
    docker-compose down
    
    # Construire les images
    log_info "Construction des images Docker..."
    docker-compose build
    
    # Démarrer les conteneurs
    log_info "Démarrage des conteneurs..."
    docker-compose up -d
    
    log_success "Les conteneurs ont été déployés avec succès."
}

# Configuration des certificats SSL
setup_ssl() {
    log_info "Configuration des certificats SSL..."
    
    # Charger les variables d'environnement
    if [ -f .env ]; then
        source .env
    else
        log_error "Le fichier .env n'existe pas. Exécutez d'abord create_env_file."
        exit 1
    fi
    
    # Vérifier si le script d'initialisation des certificats est disponible
    if [ -f ./init-letsencrypt.sh ]; then
        log_info "Exécution du script d'initialisation des certificats SSL..."
        ./init-letsencrypt.sh
        log_success "Certificats SSL configurés avec succès."
    else
        log_error "Le script init-letsencrypt.sh n'existe pas."
        exit 1
    fi
}

# Vérifier l'état des conteneurs
check_containers() {
    log_info "Vérification de l'état des conteneurs..."
    
    # Attendre que tous les conteneurs soient démarrés
    sleep 5
    
    # Afficher l'état des conteneurs
    docker-compose ps
    
    # Vérifier si tous les conteneurs sont up
    if [ $(docker-compose ps --services --filter "status=running" | wc -l) -eq $(docker-compose ps --services | wc -l) ]; then
        log_success "Tous les conteneurs sont en cours d'exécution."
    else
        log_error "Certains conteneurs ne sont pas en cours d'exécution. Consultez les logs pour plus de détails."
        docker-compose logs
    fi
}

# Afficher les informations de connexion
show_connection_info() {
    log_info "Informations de connexion:"
    
    # Charger les variables d'environnement
    if [ -f .env ]; then
        source .env
    else
        log_warning "Le fichier .env n'existe pas. Utilisation des valeurs par défaut."
        API_DOMAIN="api.bephec.org"
        TEST_DOMAIN="test.bephec.org"
    fi
    
    # Obtenir l'adresse IP publique du serveur
    SERVER_IP=$(curl -s https://api.ipify.org)
    
    echo "-------------------------------------------------------------"
    echo "🔗 API principale: https://$API_DOMAIN"
    echo "🔗 API de test: https://$TEST_DOMAIN"
    echo "🔗 Adresse IP du serveur: $SERVER_IP"
    echo "-------------------------------------------------------------"
    echo "💡 Pour tester l'API localement:"
    echo "   - API principale: http://localhost:4000"
    echo "   - API de test: http://localhost:4001"
    echo "-------------------------------------------------------------"
}

# Fonction principale
main() {
    log_info "=== Déploiement de RoadBook Server ==="
    
    # Vérification des prérequis
    check_prerequisites
    
    # Création du fichier .env
    create_env_file
    
    # Configuration DNS
    configure_dns
    
    # Mise à jour des configurations Nginx
    update_nginx_config
    
    # Déploiement des conteneurs
    deploy_containers
    
    # Configuration SSL (si demandé)
    read -p "Voulez-vous configurer les certificats SSL maintenant? (o/n): " ssl_choice
    if [[ "$ssl_choice" == "o" || "$ssl_choice" == "O" ]]; then
        setup_ssl
    else
        log_info "Vous pourrez configurer les certificats SSL ultérieurement en exécutant ./init-letsencrypt.sh"
    fi
    
    # Vérification de l'état des conteneurs
    check_containers
    
    # Afficher les informations de connexion
    show_connection_info
    
    log_info "=== Déploiement terminé ==="
    log_success "RoadBook Server a été déployé avec succès!"
}

# Exécution de la fonction principale
main