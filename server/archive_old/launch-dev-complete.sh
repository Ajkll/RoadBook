#!/bin/bash

##############################################################################
# Script de lancement de l'environnement de développement complet
# =====================================================================
#
# Ce script simplifié lance tous les services avec Docker Compose:
# - Base de données PostgreSQL (port 5432)
# - Le serveur d'API de développement principal (port 4000)
# - L'interface de test d'API (port 4001)
# - Prisma Studio pour explorer la base de données (port 5555)
#
# Auteur: Équipe RoadBook
# Date: Avril 2025
##############################################################################

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Lancement de l'environnement de développement complet =====${NC}"

# Vérifier si Docker est installé
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Docker n'est pas installé. Veuillez installer Docker.${NC}"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Le service Docker n'est pas démarré. Veuillez démarrer Docker.${NC}"
  exit 1
fi

# Vérifier les conflits de ports
echo -e "${YELLOW}🔍 Vérification des ports disponibles...${NC}"
for port in 4000 4001 5432 5555; do
  if lsof -i:"$port" >/dev/null 2>&1; then
    pid=$(lsof -t -i:"$port")
    echo -e "${YELLOW}⚠️  Le port $port est utilisé par le processus $pid. Tentative d'arrêt...${NC}"
    kill -9 "$pid" 2>/dev/null
    sleep 1
    if lsof -i:"$port" >/dev/null 2>&1; then
      echo -e "${RED}❌ Impossible de libérer le port $port.${NC}"
      exit 1
    else
      echo -e "${GREEN}✅ Port $port libéré.${NC}"
    fi
  fi
done

# S'assurer que les permissions sont correctes pour dist
echo -e "${YELLOW}🔄 Configuration des permissions...${NC}"
mkdir -p dist
chmod -R 777 dist

# Compiler le projet
echo -e "${YELLOW}🔄 Compilation du projet...${NC}"
npm run build:fast

# Arrêter les conteneurs précédents et nettoyer
echo -e "${YELLOW}🧹 Nettoyage des anciens conteneurs...${NC}"
docker-compose -f docker-compose.dev.yml down --remove-orphans

# Démarrer les conteneurs
echo -e "${YELLOW}🚀 Démarrage des conteneurs...${NC}"
docker-compose -f docker-compose.dev.yml up --build -d

# Vérifier si tous les conteneurs sont en cours d'exécution
echo -e "${YELLOW}⏳ Vérification des conteneurs...${NC}"
sleep 5
if docker ps | grep -q "server-dev" && docker ps | grep -q "prisma-studio" && docker ps | grep -q "test-api"; then
  echo -e "${GREEN}✅ Tous les services sont démarrés!${NC}"
else
  echo -e "${YELLOW}⏳ Attente supplémentaire pour les services...${NC}"
  sleep 10
  if docker ps | grep -q "server-dev" && docker ps | grep -q "prisma-studio" && docker ps | grep -q "test-api"; then
    echo -e "${GREEN}✅ Tous les services sont démarrés!${NC}"
  else
    echo -e "${RED}❌ Certains services n'ont pas démarré. Vérifiez les logs.${NC}"
    docker-compose -f docker-compose.dev.yml logs
  fi
fi

# Appliquer les migrations et remplir la base de données avec client local
echo -e "${YELLOW}🔄 Application des migrations Prisma...${NC}"
# Utiliser docker exec pour exécuter les commandes dans le conteneur server-dev
echo -e "${YELLOW}🔄 Utilisation de docker exec pour communiquer avec la base de données...${NC}"
docker exec -it server-dev npx prisma migrate deploy

# Remplir la base de données avec des données de test
echo -e "${YELLOW}🔄 Remplissage de la base de données avec des données de test...${NC}"
docker exec -it server-dev npx prisma db seed

# Afficher les URLs et instructions
echo -e "\n${BLUE}📱 Interfaces disponibles:${NC}"
echo -e "   → API principale: ${GREEN}http://localhost:4000/api${NC}"
echo -e "   → Interface de test: ${GREEN}http://localhost:4001${NC}"
echo -e "   → Prisma Studio: ${GREEN}http://localhost:5555${NC}"
echo -e "\n${BLUE}💾 Base de données PostgreSQL:${NC}"
echo -e "   → Hôte: ${GREEN}localhost${NC}"
echo -e "   → Port: ${GREEN}5432${NC}"
echo -e "   → Utilisateur: ${GREEN}postgres${NC}"
echo -e "   → Mot de passe: ${GREEN}postgres${NC}"
echo -e "   → Base de données: ${GREEN}roadbook_dev${NC}"

echo -e "\n${BLUE}💡 Commandes utiles:${NC}"
echo -e "   → Voir les logs: ${YELLOW}docker-compose -f docker-compose.dev.yml logs -f${NC}"
echo -e "   → Arrêter les services: ${YELLOW}docker-compose -f docker-compose.dev.yml down${NC}"
echo -e "   → Redémarrer un service: ${YELLOW}docker-compose -f docker-compose.dev.yml restart service-name${NC}"

echo -e "\n${GREEN}===== Environnement complet démarré =====${NC}"