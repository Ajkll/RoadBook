#!/bin/bash

# Script de validation RoadBook
# ============================
# Ce script démarre l'environnement, teste les fonctionnalités de base
# et fournit des instructions claires sur la façon d'utiliser le système

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Validation de l'environnement RoadBook =====${NC}"

# 1. Verifier si les services Docker sont en marche
echo -e "${YELLOW}Vérification des conteneurs Docker en cours d'exécution...${NC}"
if docker ps | grep -q "server-dev" && docker ps | grep -q "postgres-dev"; then
  echo -e "${GREEN}✅ Les services Docker sont actifs${NC}"
else
  echo -e "${YELLOW}Les services Docker ne sont pas démarrés. Démarrage...${NC}"
  ./reset-env.sh
  ./launch-dev.sh &
  
  # Attendre que les services soient prêts
  echo -e "${YELLOW}Attente de 20 secondes pour le démarrage des services...${NC}"
  sleep 20
fi

# 2. Test de connectivité à l'API
echo -e "\n${YELLOW}Test de connectivité à l'API...${NC}"
API_RESPONSE=$(curl -s http://localhost:4000/api/system/info)
if [[ $API_RESPONSE == *"success"* ]]; then
  echo -e "${GREEN}✅ API accessible et fonctionnelle${NC}"
  echo "$API_RESPONSE" | jq .
else
  echo -e "${RED}❌ Impossible de se connecter à l'API${NC}"
  echo -e "${YELLOW}Avez-vous démarré l'environnement avec ./launch-dev.sh ?${NC}"
  exit 1
fi

# 3. Vérification des données de la base
echo -e "\n${YELLOW}Vérification des données de la base de données...${NC}"
USER_COUNT=$(docker exec server-dev npx prisma db execute --command "SELECT COUNT(*) FROM \"User\"" --json 2>/dev/null | grep -o '[0-9]\+' || echo "0")

if [ "$USER_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ $USER_COUNT utilisateurs trouvés dans la base de données${NC}"
else
  echo -e "${YELLOW}⚠️ Aucun utilisateur trouvé, tentative de seed progressif...${NC}"
  ./progressive-seed.sh
  
  # Vérifier si des utilisateurs ont été créés
  USER_COUNT=$(docker exec server-dev npx prisma db execute --command "SELECT COUNT(*) FROM \"User\"" --json 2>/dev/null | grep -o '[0-9]\+' || echo "0")
  
  if [ "$USER_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Le seed progressif a échoué, création d'utilisateurs de test avec l'API...${NC}"
    ./create-test-users.sh
  fi
fi

# 4. Test de connexion avec un utilisateur
echo -e "\n${YELLOW}Test de connexion...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apprentice@roadbook.com",
    "password": "Password123!"
  }')

# Vérifier si la connexion a réussi
if [[ $LOGIN_RESPONSE == *"success"* ]]; then
  echo -e "${GREEN}✅ Connexion réussie!${NC}"
  echo "$LOGIN_RESPONSE" | jq .
  
  # Extraire le token
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
  
  # Tester l'accès aux informations utilisateur
  echo -e "\n${YELLOW}Test d'accès aux informations utilisateur...${NC}"
  USER_RESPONSE=$(curl -s -X GET "http://localhost:4000/api/users/me" \
    -H "Authorization: Bearer $TOKEN")
  echo "$USER_RESPONSE" | jq .
else
  echo -e "${RED}❌ Échec de la connexion${NC}"
  echo "$LOGIN_RESPONSE" | jq .
fi

# 5. Résumé et instructions
echo -e "\n${BLUE}===== Résumé =====${NC}"
echo -e "${GREEN}Services disponibles:${NC}"
echo -e "  - API principale: ${YELLOW}http://localhost:4000/api${NC}"
echo -e "  - Interface de test API: ${YELLOW}http://localhost:4001${NC}"
echo -e "  - Prisma Studio: ${YELLOW}http://localhost:5555${NC}"

echo -e "\n${GREEN}Utilisateurs de test:${NC}"
echo -e "  - Apprenti: ${YELLOW}apprentice@roadbook.com / Password123!${NC}"
echo -e "  - Guide: ${YELLOW}guide@roadbook.com / Password123!${NC}"
echo -e "  - Admin: ${YELLOW}admin@roadbook.com / Password123!${NC}"

echo -e "\n${GREEN}Scripts utiles:${NC}"
echo -e "  - ${YELLOW}./roadbook.sh dev${NC} : Démarrer l'environnement de développement"
echo -e "  - ${YELLOW}./roadbook.sh test${NC} : Exécuter les tests"
echo -e "  - ${YELLOW}./roadbook.sh reset${NC} : Réinitialiser l'environnement"
echo -e "  - ${YELLOW}./test-api.sh${NC} : Tester l'API avec curl"

echo -e "\n${BLUE}==============================================${NC}"