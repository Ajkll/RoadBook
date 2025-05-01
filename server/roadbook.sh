#!/bin/bash
# Script principal simplifié pour RoadBook
# Une seule source de vérité pour toutes les commandes liées au projet

set -e

# Configuration
export DB_PORT="5433"
export API_PORT="4000"
export TEST_PORT="4001"
export STUDIO_PORT="5555"
export DB_USER="postgres"
export DB_PASSWORD="postgres"
export DB_NAME="roadbook_dev"

# Variables d'environnement pour la connexion locale à Postgres dans Docker
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"
export JWT_SECRET="your-very-secure-jwt-secret-for-development"
export JWT_REFRESH_TOKEN_SECRET="your-very-secure-refresh-token-secret-for-development"

# Messages stylisés
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function print_header() {
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}🛠️  ${1}${NC}"
  echo -e "${BLUE}================================================${NC}"
}

function print_success() {
  echo -e "${GREEN}✅ ${1}${NC}"
}

function print_info() {
  echo -e "${YELLOW}ℹ️ ${1}${NC}"
}

function print_error() {
  echo -e "${RED}❌ ${1}${NC}"
  exit 1
}

# Fonctions principales
function clean_port() {
  local port=$1
  
  print_info "Tentative de nettoyage du port $port..."
  
  # Essayer différentes méthodes pour tuer les processus
  # Méthode 1: fuser
  if command -v fuser &> /dev/null; then
    fuser -k -n tcp $port 2>/dev/null || true
  fi
  
  # Méthode 2: netstat + kill
  if command -v netstat &> /dev/null; then
    local pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1)
    if [ -n "$pid" ]; then
      kill -9 $pid 2>/dev/null || true
    fi
  fi
  
  # Méthode 3: ss + kill
  if command -v ss &> /dev/null; then
    local pid=$(ss -tlnp | grep ":$port " | sed 's/.*pid=\([0-9]*\).*/\1/g')
    if [ -n "$pid" ]; then
      kill -9 $pid 2>/dev/null || true
    fi
  fi
  
  # Méthode 4: lsof (moins probable sur WSL, mais tentons)
  if command -v lsof &> /dev/null; then
    local pids=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pids" ]; then
      echo $pids | xargs -r kill -9 2>/dev/null || true
    fi
  fi
  
  # Vérifier si le port est maintenant disponible
  sleep 1
  
  # Méthode simple pour vérifier si un port est utilisé
  if (echo > /dev/tcp/localhost/$port) 2>/dev/null; then
    print_error "Impossible de libérer le port $port. Essayez de redémarrer votre système."
  else
    print_success "Port $port libéré ou déjà disponible"
  fi
}

function start_postgres() {
  print_info "Démarrage de PostgreSQL dans Docker..."
  docker-compose -f docker-compose.dev.yml up -d postgres-dev
  
  # Attendre que PostgreSQL soit prêt
  print_info "Attente que PostgreSQL soit prêt..."
  sleep 3
  
  # Vérifier si la connexion est établie
  docker exec postgres-dev pg_isready -U postgres || print_error "PostgreSQL n'est pas prêt après 3 secondes"
}

function generate_prisma_client() {
  print_info "Génération du client Prisma..."
  npx prisma generate
}

function run_migrations() {
  print_info "Application des migrations Prisma..."
  npx prisma migrate deploy
}

function run_seed() {
  print_info "Seeding de la base de données..."
  
  # Vérifier si la base contient déjà des données en utilisant une commande SQL directe
  USER_COUNT=$(docker exec postgres-dev psql -U postgres -d roadbook_dev -t -c "SELECT COUNT(*) FROM \"User\"" 2>/dev/null || echo "0")
  USER_COUNT=$(echo $USER_COUNT | tr -d '[:space:]')
  
  if [ "$USER_COUNT" -gt "0" ]; then
    print_info "Base de données déjà alimentée avec $USER_COUNT utilisateurs"
  else
    print_info "Alimentation de la base de données..."
    npx prisma db seed
  fi
}

function start_api() {
  # Nettoyer le port avant de démarrer
  clean_port $API_PORT
  
  print_info "Démarrage de l'API en mode développement..."
  npm run dev
}

function start_test_server() {
  # Nettoyer le port avant de démarrer
  clean_port $TEST_PORT
  
  print_info "Compilation du projet..."
  npm run build:fast
  
  print_info "Démarrage du serveur de test API..."
  NODE_ENV=development PORT=$TEST_PORT TEST_API=true node test-server.js
}

function run_prisma_studio() {
  # Nettoyer le port avant de démarrer
  clean_port $STUDIO_PORT
  
  print_info "Démarrage de Prisma Studio..."
  npx prisma studio --port $STUDIO_PORT
}

function run_tests() {
  print_info "Exécution des tests unitaires essentiels..."
  npx jest --runInBand --testMatch '**/auth.service.test.ts' '**/user.service.test.ts' '**/roadbook.service.test.ts' '**/basics.test.ts'
}

# Commande principale
case "$1" in
  dev)
    print_header "DÉMARRAGE DE L'ENVIRONNEMENT DE DÉVELOPPEMENT"
    clean_port $API_PORT
    start_postgres
    generate_prisma_client
    run_migrations
    run_seed
    start_api
    ;;
    
  test-api)
    print_header "DÉMARRAGE DU SERVEUR DE TEST API"
    clean_port $TEST_PORT
    start_postgres
    generate_prisma_client
    run_migrations
    run_seed
    start_test_server
    ;;
    
  studio)
    print_header "DÉMARRAGE DE PRISMA STUDIO"
    clean_port $STUDIO_PORT
    start_postgres
    generate_prisma_client
    run_prisma_studio
    ;;
    
  test)
    print_header "EXÉCUTION DES TESTS UNITAIRES ESSENTIELS"
    start_postgres
    generate_prisma_client
    run_migrations
    run_seed
    run_tests
    ;;
    
  generate)
    print_header "GÉNÉRATION DU CLIENT PRISMA"
    generate_prisma_client
    ;;
    
  migrate)
    print_header "APPLICATION DES MIGRATIONS"
    start_postgres
    generate_prisma_client
    run_migrations
    ;;
    
  seed)
    print_header "SEEDING DE LA BASE DE DONNÉES"
    start_postgres
    generate_prisma_client
    run_migrations
    run_seed
    ;;
    
  clean)
    print_header "NETTOYAGE DES PORTS"
    clean_port $API_PORT
    clean_port $TEST_PORT
    clean_port $STUDIO_PORT
    print_success "Nettoyage des ports terminé"
    ;;
    
  *)
    print_header "ROADBOOK - SCRIPT DE DÉVELOPPEMENT"
    echo "Usage: ./roadbook.sh [commande]"
    echo ""
    echo "Commandes disponibles:"
    echo "  dev          Démarrer l'environnement de développement (API)"
    echo "  test-api     Démarrer le serveur de test API avec interface HTML"
    echo "  studio       Démarrer Prisma Studio"
    echo "  test         Exécuter les tests unitaires essentiels"
    echo "  generate     Générer le client Prisma"
    echo "  migrate      Appliquer les migrations Prisma"
    echo "  seed         Alimenter la base de données avec les données de test"
    echo "  clean        Nettoyer les ports utilisés (4000, 4001, 5555)"
    echo ""
    echo "Exemple: ./roadbook.sh dev"
    ;;
esac