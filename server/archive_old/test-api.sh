#!/bin/bash

# Test API Script - Utilisant cURL
# =========================
# Script pour tester l'API RoadBook avec curl

API_URL="http://localhost:4000/api"
TOKEN=""

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== RoadBook API Test Tool =====${NC}"

# Vérifier le statut du serveur
echo -e "${YELLOW}Vérification du statut du serveur...${NC}"
STATUS_RESPONSE=$(curl -s $API_URL/system/info)
echo $STATUS_RESPONSE | jq .

# Tenter d'enregistrer un utilisateur de test
echo -e "\n${YELLOW}Création d'un nouvel utilisateur test...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_api_user@example.com",
    "password": "Password123!",
    "displayName": "Test API User",
    "role": "APPRENTICE"
  }')
echo $REGISTER_RESPONSE | jq .

# Connecter l'utilisateur pour obtenir un token
echo -e "\n${YELLOW}Connexion de l'utilisateur test...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test_api_user@example.com",
    "password": "Password123!"
  }')
echo $LOGIN_RESPONSE | jq .

# Extraire le token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "\n${GREEN}✅ Token JWT obtenu!${NC}"
  
  # Accéder aux informations de l'utilisateur authentifié
  echo -e "\n${YELLOW}Récupération des informations utilisateur...${NC}"
  curl -s -X GET "$API_URL/users/me" \
    -H "Authorization: Bearer $TOKEN" | jq .
    
  # Liste des utilisateurs (nécessite les droits d'admin)
  echo -e "\n${YELLOW}Tentative de récupération de la liste des utilisateurs...${NC}"
  curl -s -X GET "$API_URL/users" \
    -H "Authorization: Bearer $TOKEN" | jq .
else
  echo -e "\n${RED}❌ Échec de l'authentification${NC}"
fi

echo -e "\n${BLUE}===== Test terminé =====${NC}"