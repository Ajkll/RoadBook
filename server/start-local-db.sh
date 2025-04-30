#!/bin/bash

##############################################################################
# Script de démarrage d'une base de données PostgreSQL locale
# =========================================================
#
# Ce script démarre une base de données PostgreSQL dans un conteneur Docker
# et l'expose sur le port 5433 pour éviter les conflits avec d'autres
# installations PostgreSQL.
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

echo -e "${BLUE}===== Démarrage de la base de données PostgreSQL locale =====${NC}"

# Variables
DB_CONTAINER_NAME="roadbook-postgres-dev"
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=roadbook_dev

# Vérifier si Docker est installé
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Docker n'est pas installé. Veuillez installer Docker.${NC}"
  exit 1
fi

# Vérifier si Docker est en cours d'exécution
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Le service Docker n'est pas démarré. Veuillez démarrer Docker.${NC}"
  exit 1
fi

# Vérifier si le conteneur existe déjà
if docker ps -a | grep -q $DB_CONTAINER_NAME; then
  # Si le conteneur existe, vérifier s'il est en cours d'exécution
  if docker ps | grep -q $DB_CONTAINER_NAME; then
    echo -e "${GREEN}✅ Conteneur PostgreSQL déjà démarré.${NC}"
    DB_RUNNING=true
  else
    echo -e "${YELLOW}🔄 Redémarrage du conteneur PostgreSQL...${NC}"
    docker start $DB_CONTAINER_NAME
    if [ $? -ne 0 ]; then
      echo -e "${RED}❌ Impossible de démarrer le conteneur PostgreSQL. Suppression et recréation...${NC}"
      docker rm $DB_CONTAINER_NAME
      DB_RUNNING=false
    else
      DB_RUNNING=true
    fi
  fi
else
  DB_RUNNING=false
fi

# Créer un nouveau conteneur si nécessaire
if [ "$DB_RUNNING" = false ]; then
  echo -e "${YELLOW}🔄 Création d'un nouveau conteneur PostgreSQL...${NC}"
  docker run --name $DB_CONTAINER_NAME \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_DB=$DB_NAME \
    -p $DB_PORT:5432 \
    -d postgres:14
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Échec de la création du conteneur PostgreSQL.${NC}"
    exit 1
  fi
  
  # Attendre que PostgreSQL soit prêt
  echo -e "${YELLOW}⏳ Attente que PostgreSQL soit prêt...${NC}"
  for i in {1..30}; do
    if docker exec $DB_CONTAINER_NAME pg_isready -h localhost -U postgres > /dev/null 2>&1; then
      echo -e "${GREEN}✅ PostgreSQL est prêt!${NC}"
      break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 30 ]; then
      echo -e "${RED}❌ PostgreSQL n'est pas prêt après 30 secondes. Abandon.${NC}"
      exit 1
    fi
  done
fi

# Informations de connexion
echo -e "\n${BLUE}💾 Informations de connexion PostgreSQL:${NC}"
echo -e "   → Hôte: ${GREEN}localhost${NC}"
echo -e "   → Port: ${GREEN}$DB_PORT${NC}"
echo -e "   → Utilisateur: ${GREEN}$DB_USER${NC}"
echo -e "   → Mot de passe: ${GREEN}$DB_PASSWORD${NC}"
echo -e "   → Base de données: ${GREEN}$DB_NAME${NC}"
echo -e "   → URL de connexion: ${GREEN}postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME${NC}"

echo -e "\n${GREEN}✅ Base de données PostgreSQL prête à l'emploi!${NC}"
echo -e "${YELLOW}💡 Utilisez les scripts suivants pour interagir avec la base de données:${NC}"
echo -e "   → ${GREEN}./roadbook.sh seed:quick${NC} - Remplir la base de données avec des données de test"
echo -e "   → ${GREEN}./roadbook.sh prisma:studio${NC} - Ouvrir Prisma Studio pour explorer la base de données"