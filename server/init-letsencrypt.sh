#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages
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

# Domaines
domains=(api.bephec.org test.bephec.org)
rsa_key_size=4096
data_path="./certbot"
email="votre.email@example.com" # Remplacez par votre adresse email

# Configuration initiale
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  log_info "Création du répertoire pour les certificats SSL..."
  mkdir -p "$data_path/conf"
  
  log_info "Téléchargement des paramètres SSL recommandés..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  
  log_success "Téléchargement terminé."
fi

# Création de certificats dummy
for domain in "${domains[@]}"; do
  if [ ! -d "$data_path/conf/live/$domain" ]; then
    log_info "Création de certificats temporaires pour $domain..."
    
    mkdir -p "$data_path/conf/live/$domain"
    
    openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
      -keyout "$data_path/conf/live/$domain/privkey.pem" \
      -out "$data_path/conf/live/$domain/fullchain.pem" \
      -subj "/CN=localhost"
    
    log_success "Certificats temporaires créés pour $domain."
  fi
done

# Créer un répertoire pour les challenges
mkdir -p "$data_path/www"

# Démarrer nginx
log_info "Démarrage de nginx..."
docker-compose up --force-recreate -d nginx
log_success "Nginx démarré."

# Attendre que nginx soit prêt
sleep 5

# Obtention des certificats
for domain in "${domains[@]}"; do
  log_info "Obtention des certificats pour $domain..."
  
  docker-compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
      --email $email \
      -d $domain \
      --rsa-key-size $rsa_key_size \
      --agree-tos \
      --force-renewal" certbot
      
  log_success "Certificats obtenus pour $domain."
done

# Création des liens symboliques pour nginx
log_info "Création des liens symboliques pour nginx..."
mkdir -p ./nginx/ssl/live
for domain in "${domains[@]}"; do
  mkdir -p "./nginx/ssl/live/$domain"
  ln -sf "$data_path/conf/live/$domain/fullchain.pem" "./nginx/ssl/live/$domain/fullchain.pem"
  ln -sf "$data_path/conf/live/$domain/privkey.pem" "./nginx/ssl/live/$domain/privkey.pem"
done
log_success "Liens symboliques créés."

# Redémarrage de nginx
log_info "Redémarrage de nginx..."
docker-compose exec nginx nginx -s reload
log_success "Nginx redémarré."

log_info "Vos certificats SSL sont maintenant installés et configurés."
log_success "Vos domaines sont accessibles via HTTPS : https://api.bephec.org et https://test.bephec.org"