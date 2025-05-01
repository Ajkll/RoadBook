#!/bin/bash

##############################################################################
# Script de lancement de l'environnement de développement RoadBook
# ================================================================
#
# Ce script automatise le démarrage complet de l'environnement de développement:
# - Vérifie la présence de Docker et des fichiers de configuration
# - Nettoie l'environnement existant (arrêt des conteneurs et libération des ports)
# - Démarre l'environnement complet avec docker-compose
# - Configure et remplit la base de données avec les données de test
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

echo -e "${BLUE}===== Lancement du serveur de développement RoadBook avec Docker =====${NC}"

# 1. Vérifier si Docker est installé et en cours d'exécution
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Docker n'est pas installé. Veuillez installer Docker.${NC}"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Le service Docker n'est pas démarré. Veuillez démarrer Docker.${NC}"
  exit 1
fi

# 2. S'assurer que docker-compose est disponible
if ! command -v docker-compose >/dev/null 2>&1 && ! command -v docker compose >/dev/null 2>&1; then
  echo -e "${RED}⚠️  docker-compose n'est pas disponible. Vérifiez votre installation Docker.${NC}"
  exit 1
fi

# 3. Nettoyer l'environnement existant
echo -e "${YELLOW}🧹 Nettoyage des environnements existants...${NC}"

# Arrêter tous les conteneurs existants
echo -e "${YELLOW}Arrêt des conteneurs Docker...${NC}"
docker-compose -f docker-compose.dev.yml down --remove-orphans

# Vérifier et libérer les ports utilisés
echo -e "${YELLOW}Vérification des ports...${NC}"
for port in 4000 4001 5433 5555; do
  if lsof -i:$port -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Libération du port $port...${NC}"
    lsof -i:$port -t | xargs -r kill -9
  fi
done

# 4. Construire les images
echo -e "${YELLOW}🔄 Construction des conteneurs Docker...${NC}"
docker-compose -f docker-compose.dev.yml build

# 5. Démarrer l'environnement de développement en mode détaché
echo -e "${YELLOW}🚀 Démarrage de l'environnement de développement...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# 6. Attendre que la base de données soit prête
echo -e "${YELLOW}⏳ Attente que la base de données soit prête...${NC}"
for i in {1..30}; do
  if docker exec postgres-dev pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Base de données prête !${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ La base de données n'est pas disponible après 30 secondes. Arrêt du processus.${NC}"
    docker-compose -f docker-compose.dev.yml down
    exit 1
  fi
  echo -e "${YELLOW}Attente de la base de données... ($i/30)${NC}"
  sleep 1
done

# 7. Exécuter les migrations
echo -e "${YELLOW}🔄 Exécution des migrations Prisma...${NC}"
docker exec server-dev npx prisma migrate deploy

# 8. Remplir la base de données avec les données de test
echo -e "${YELLOW}🌱 Remplissage de la base de données avec des données de test...${NC}"
echo -e "${YELLOW}Utilisation du seed progressif pour éviter les erreurs de segmentation...${NC}"
docker exec -e NODE_OPTIONS="--max-old-space-size=512" server-dev npx ts-node prisma/seeds/progressive-seed.ts || {
  echo -e "${YELLOW}⚠️ Le remplissage progressif a échoué, tentative de remplissage minimal...${NC}"
  # Try minimal seed instead
  docker exec server-dev npm run seed:minimal
}

# 9. Vérifier que tous les services sont en cours d'exécution
echo -e "${YELLOW}🔍 Vérification de l'état des services...${NC}"
if ! docker ps | grep -q "server-dev" || ! docker ps | grep -q "test-api" || ! docker ps | grep -q "prisma-studio"; then
  echo -e "${RED}❌ Certains services ne sont pas en cours d'exécution. Consultez les logs pour plus de détails.${NC}"
  docker-compose -f docker-compose.dev.yml logs
else
  echo -e "${GREEN}✅ Tous les services sont en cours d'exécution !${NC}"
fi

# 10. Afficher les URL des services
echo -e "\n${BLUE}========== Environnement de développement prêt ! ==========${NC}"
echo -e "${GREEN}🔹 API principale: ${YELLOW}http://localhost:4000/api${NC}"
echo -e "${GREEN}🔹 Interface de test: ${YELLOW}http://localhost:4001${NC}"
echo -e "${GREEN}🔹 Prisma Studio: ${YELLOW}http://localhost:5555${NC}"
echo -e "${GREEN}🔹 Base de données: ${YELLOW}postgres-dev:5432 (postgresql://postgres:postgres@localhost:5433/roadbook_dev)${NC}"
echo -e "${BLUE}=============================================================${NC}"

# 11. Afficher les logs en temps réel
echo -e "${YELLOW}📋 Affichage des logs des conteneurs (Ctrl+C pour arrêter l'affichage)...${NC}"
docker-compose -f docker-compose.dev.yml logs -f

# 12. Gérer la terminaison avec trap (pour nettoyer si l'utilisateur interrompt l'affichage des logs)
function cleanup {
  echo -e "\n${YELLOW}🧹 Les conteneurs continuent de s'exécuter en arrière-plan.${NC}"
  echo -e "${YELLOW}Pour les arrêter, exécutez: ${GREEN}docker-compose -f docker-compose.dev.yml down${NC}"
}

# Capturer Ctrl+C pour nettoyer proprement
trap cleanup EXIT