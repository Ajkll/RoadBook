#!/bin/bash

##############################################################################
# Script pour lancer les tests avec des conteneurs Docker
# =====================================================
#
# Ce script utilise docker-compose pour créer un environnement complet de test:
# - Vérifie que Docker est installé et en cours d'exécution
# - Arrête les anciens conteneurs pour éviter les conflits
# - S'assure que les permissions sont correctes pour les fichiers générés
# - Construit et démarre les conteneurs de test
# - Capture et rapporte le résultat des tests
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

echo -e "${BLUE}===== Lancement des tests dans des conteneurs Docker =====${NC}"

# 1. Vérifier si Docker est installé et en cours d'exécution
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Docker n'est pas installé. Veuillez installer Docker.${NC}"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}⚠️  Le service Docker n'est pas démarré. Veuillez démarrer Docker.${NC}"
  exit 1
fi

# 2. Vérifier si les processus sur les ports requis sont déjà en cours d'exécution
function is_port_available() {
  nc -z localhost $1 >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Le port $1 est déjà utilisé.${NC}"
    return 1
  fi
  return 0
}

function kill_process_on_port() {
  local port=$1
  local pid=$(lsof -t -i:$port)
  
  if [ ! -z "$pid" ]; then
    echo -e "${YELLOW}⚠️  Port $port est utilisé par le processus $pid. Tentative d'arrêt...${NC}"
    kill -9 $pid 2>/dev/null
    sleep 1
    if ! is_port_available $port; then
      echo -e "${RED}❌ Impossible de libérer le port $port.${NC}"
      return 1
    else
      echo -e "${GREEN}✅ Port $port libéré.${NC}"
      return 0
    fi
  fi
  return 0
}

# Libérer les ports si nécessaire
kill_process_on_port 5433 # PostgreSQL test
kill_process_on_port 4002 # Server test API port

# 3. Préparer les répertoires et les permissions
echo -e "${YELLOW}🔄 Préparation des répertoires...${NC}"
mkdir -p dist/tests/utils dist/tests/mocks test-results logs
chmod -R 777 dist/ test-results/ logs/

# 4. Afficher un message de démarrage des conteneurs
echo -e "${YELLOW}🐳 Démarrage des conteneurs de test...${NC}"

# 5. Arrêter et supprimer les conteneurs existants
echo -e "${YELLOW}🧹 Nettoyage des anciens conteneurs...${NC}"
docker-compose -f docker-compose.test.yml down --remove-orphans --volumes

# 6. Construire et démarrer les conteneurs
echo -e "${YELLOW}🚀 Construction et démarrage des conteneurs de test...${NC}"
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# 7. Récupérer le code de sortie du conteneur de test
TEST_EXIT_CODE=$(docker-compose -f docker-compose.test.yml ps -q test-server | xargs docker inspect -f '{{ .State.ExitCode }}')

# 8. Nettoyage final
echo -e "${YELLOW}🧹 Nettoyage des conteneurs de test...${NC}"
docker-compose -f docker-compose.test.yml down --remove-orphans --volumes

# 9. Afficher le résultat final
if [ "$TEST_EXIT_CODE" = "0" ]; then
  echo -e "${GREEN}✅ Tous les tests ont réussi!${NC}"
else
  echo -e "${RED}❌ Des tests ont échoué. Code de sortie: $TEST_EXIT_CODE${NC}"
fi

echo -e "${BLUE}===== Tests terminés =====${NC}"

# 10. Restaurer les permissions normales
echo -e "${YELLOW}🔄 Restauration des permissions...${NC}"
if [ -d "dist" ]; then
  chmod -R 755 dist/
fi

exit $TEST_EXIT_CODE