#!/bin/bash

# Script de seeding progressif pour la base de données RoadBook
# =========================================
# Ce script exécute le seeding progressif de la base de données
# pour éviter les erreurs de segmentation (segfault)

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== RoadBook Progressive Database Seeding =====${NC}"

# Vérifier si nous sommes dans un conteneur Docker
IN_DOCKER=false
if [ -f /.dockerenv ] || [ -f /run/.containerenv ]; then
  IN_DOCKER=true
  echo -e "${YELLOW}Exécution dans un conteneur Docker détectée${NC}"
fi

# Fonction pour exécuter le script dans Docker ou localement
run_seed() {
  NODE_OPTIONS="--max-old-space-size=512" # Limite de mémoire pour éviter les crash

  if [ "$IN_DOCKER" = true ]; then
    echo -e "${YELLOW}Exécution du seed progressif dans le conteneur...${NC}"
    
    # Exécution dans le conteneur actuel
    NODE_OPTIONS=$NODE_OPTIONS npx ts-node prisma/seeds/progressive-seed.ts
  else
    echo -e "${YELLOW}Exécution du seed progressif en utilisant Docker...${NC}"
    
    # Vérifier si le conteneur server-dev existe
    if docker ps | grep -q "server-dev"; then
      echo -e "${YELLOW}Conteneur server-dev trouvé, exécution du seed...${NC}"
      docker exec -e NODE_OPTIONS=$NODE_OPTIONS server-dev npx ts-node prisma/seeds/progressive-seed.ts
    else
      echo -e "${RED}Conteneur server-dev non trouvé.${NC}"
      echo -e "${YELLOW}Essai avec d'autres conteneurs...${NC}"
      
      # Essayer d'autres conteneurs potentiels
      if docker ps | grep -q "test-server"; then
        echo -e "${YELLOW}Conteneur test-server trouvé, exécution du seed...${NC}"
        docker exec -e NODE_OPTIONS=$NODE_OPTIONS test-server npx ts-node prisma/seeds/progressive-seed.ts
      else
        echo -e "${RED}Aucun conteneur approprié trouvé.${NC}"
        echo -e "${YELLOW}Exécution du seed en local...${NC}"
        NODE_OPTIONS=$NODE_OPTIONS npx ts-node prisma/seeds/progressive-seed.ts
      fi
    fi
  fi
}

# Exécuter le seed
echo -e "${YELLOW}Démarrage du seeding progressif...${NC}"
run_seed

# Vérifier le résultat
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Seeding progressif terminé avec succès !${NC}"
  
  # Vérifier le nombre d'utilisateurs pour confirmer
  if [ "$IN_DOCKER" = true ]; then
    USER_COUNT=$(npx prisma db execute --command "SELECT COUNT(*) FROM \"User\"" --json | grep -o '[0-9]\+')
  else
    USER_COUNT=$(docker exec server-dev npx prisma db execute --command "SELECT COUNT(*) FROM \"User\"" --json 2>/dev/null | grep -o '[0-9]\+' || echo "0")
  fi
  
  echo -e "${GREEN}Nombre d'utilisateurs dans la base de données: ${USER_COUNT}${NC}"
else
  echo -e "${RED}❌ Échec du seeding progressif.${NC}"
  echo -e "${YELLOW}Essai d'un seed minimal avec uniquement les utilisateurs...${NC}"
  
  # Essayer un seed minimal
  if [ "$IN_DOCKER" = true ]; then
    NODE_OPTIONS=$NODE_OPTIONS npx ts-node prisma/seeds/minimal-seed.ts
  else
    docker exec -e NODE_OPTIONS=$NODE_OPTIONS server-dev npx ts-node prisma/seeds/minimal-seed.ts 2>/dev/null || npx ts-node prisma/seeds/minimal-seed.ts
  fi
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seed minimal terminé avec succès.${NC}"
  else
    echo -e "${RED}❌ Échec du seed minimal également.${NC}"
    exit 1
  fi
fi

echo -e "${BLUE}===== Seeding terminé =====${NC}"