#!/bin/bash

# =========================================================
# Script de réinitialisation de l'environnement RoadBook
# =========================================================
# Ce script arrête tous les conteneurs, supprime les volumes,
# libère les ports et prépare l'environnement pour un redémarrage propre.

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Réinitialisation complète de l'environnement RoadBook =====${NC}"

# 1. Arrêter tous les conteneurs
echo -e "${YELLOW}Arrêt des conteneurs Docker...${NC}"
docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
docker-compose -f docker-compose.test.yml down --volumes --remove-orphans
docker-compose down --volumes --remove-orphans

# 2. Supprimer les volumes Docker (optionnel mais plus complet)
echo -e "${YELLOW}Suppression des volumes Docker liés au projet...${NC}"
docker volume rm roadbook-postgres-dev-data roadbook-postgres-test-data roadbook-postgres-prod-data roadbook-server-logs 2>/dev/null || true

# 3. Tuer tous les processus Node.js en cours qui pourraient être liés au projet
echo -e "${YELLOW}Arrêt des processus Node.js...${NC}"
pkill -f "node.*test-server.js" || true
pkill -f "prisma studio" || true
pkill -f "ts-node.*src/index.ts" || true
pkill -f "nodemon.*src/index.ts" || true

# 4. Nettoyer les ports utilisés
echo -e "${YELLOW}Libération des ports utilisés...${NC}"
for port in 4000 4001 4002 5432 5433 5434 5555; do
  if lsof -i:$port -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Libération du port $port...${NC}"
    lsof -i:$port -t | xargs -r kill -9
  fi
done

# 5. Vérifier que les ports sont libres
echo -e "${YELLOW}Vérification que les ports sont libres...${NC}"
ports_in_use=""
for port in 4000 4001 4002 5432 5433 5434 5555; do
  if lsof -i:$port -t >/dev/null 2>&1; then
    ports_in_use="$ports_in_use $port"
  fi
done

if [ -n "$ports_in_use" ]; then
  echo -e "${RED}⚠️ Certains ports sont toujours utilisés:$ports_in_use${NC}"
  echo -e "${RED}Vous devrez peut-être redémarrer votre terminal ou votre ordinateur.${NC}"
else
  echo -e "${GREEN}✅ Tous les ports sont libres !${NC}"
fi

# 6. Nettoyage additionnel des fichiers temporaires ou des locks
echo -e "${YELLOW}Nettoyage des fichiers temporaires...${NC}"
rm -rf node_modules/.prisma || true
rm -rf node_modules/.cache || true
rm -rf prisma/.prisma || true

# 7. Compilation du projet pour s'assurer qu'il est à jour
echo -e "${YELLOW}Compilation du projet...${NC}"
npm run build:fast

echo -e "${GREEN}✅ Réinitialisation terminée !${NC}"
echo -e "${BLUE}=============================================================${NC}"
echo -e "${YELLOW}Pour redémarrer l'environnement de développement, exécutez:${NC}"
echo -e "${GREEN}./launch-dev.sh${NC}"
echo -e "${BLUE}=============================================================${NC}"