#!/bin/bash

##############################################################################
# Script de lancement des tests RoadBook
# ================================================================
#
# Ce script automatise l'exécution des tests avec Docker:
# - Vérifie la présence de Docker et des fichiers de configuration
# - Démarre l'environnement de test avec docker-compose
# - Exécute les tests unitaires et d'intégration
# - Affiche les résultats des tests
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

echo -e "${BLUE}===== Lancement des tests RoadBook avec Docker =====${NC}"

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
echo -e "${YELLOW}Arrêt des conteneurs Docker existants...${NC}"
docker-compose -f docker-compose.test.yml down --remove-orphans

# Vérifier et libérer les ports utilisés
echo -e "${YELLOW}Vérification des ports...${NC}"
for port in 4002 5434; do
  if lsof -i:$port -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Libération du port $port...${NC}"
    lsof -i:$port -t | xargs -r kill -9
  fi
done

# 4. Construire et lancer les conteneurs de test
echo -e "${YELLOW}🔄 Construction et démarrage des conteneurs de test...${NC}"
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# 5. Afficher le statut final
test_status=$?
if [ $test_status -eq 0 ]; then
  echo -e "\n${GREEN}✅ Tous les tests ont réussi !${NC}"
else
  echo -e "\n${RED}❌ Certains tests ont échoué (code: $test_status).${NC}"
fi

# 6. Nettoyage
echo -e "${YELLOW}🧹 Nettoyage de l'environnement de test...${NC}"
docker-compose -f docker-compose.test.yml down

echo -e "${BLUE}===== Tests terminés =====${NC}"
exit $test_status