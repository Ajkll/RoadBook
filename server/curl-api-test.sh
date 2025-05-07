#!/bin/bash

# API Test Script using curl
# =========================
#
# Permet de tester les API endpoints de RoadBook en utilisant curl
# Fournit des commandes pour l'authentification, la gestion des utilisateurs, etc.

API_URL="http://localhost:4000/api"
TEST_API_URL="http://localhost:4001/api"
TOKEN=""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher l'aide
show_help() {
    echo -e "${BLUE}===== RoadBook API Test Tool =====${NC}"
    echo ""
    echo -e "Usage: ${YELLOW}./curl-api-test.sh${NC} ${GREEN}[command]${NC}"
    echo ""
    echo -e "${BLUE}Commandes disponibles:${NC}"
    echo -e "  ${GREEN}register${NC}             Créer un nouvel utilisateur"
    echo -e "  ${GREEN}login${NC}                Se connecter pour obtenir un token JWT"
    echo -e "  ${GREEN}users${NC}                Lister tous les utilisateurs"
    echo -e "  ${GREEN}user <id>${NC}            Obtenir les détails d'un utilisateur"
    echo -e "  ${GREEN}status${NC}               Vérifier le statut de l'API"
    echo -e "  ${GREEN}help${NC}                 Afficher cette aide"
    echo ""
}

# Fonction pour créer un utilisateur
register() {
    echo -e "${BLUE}Création d'un nouvel utilisateur${NC}"
    
    read -p "Email: " email
    read -p "Mot de passe: " password
    read -p "Nom d'affichage: " displayName
    read -p "Rôle (APPRENTICE, GUIDE, INSTRUCTOR, ADMIN): " role
    
    response=$(curl -s -X POST "$API_URL/auth/register" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "'"$email"'",
        "password": "'"$password"'",
        "displayName": "'"$displayName"'",
        "role": "'"$role"'"
      }')
    
    echo -e "${GREEN}Réponse:${NC}"
    echo $response | jq '.'
}

# Fonction pour se connecter
login() {
    echo -e "${BLUE}Connexion${NC}"
    
    read -p "Email: " email
    read -p "Mot de passe: " password
    
    response=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "'"$email"'",
        "password": "'"$password"'"
      }')
    
    echo -e "${GREEN}Réponse:${NC}"
    echo $response | jq '.'
    
    # Extraire le token
    token=$(echo $response | jq -r '.data.accessToken')
    
    if [ "$token" != "null" ]; then
        echo -e "${GREEN}Token JWT obtenu!${NC}"
        TOKEN=$token
        echo "export TOKEN='$TOKEN'" > token.env
        echo -e "${YELLOW}Token sauvegardé dans token.env${NC}"
    else
        echo -e "${RED}Échec de l'authentification${NC}"
    fi
}

# Fonction pour lister les utilisateurs
list_users() {
    echo -e "${BLUE}Liste des utilisateurs${NC}"
    
    # Charger le token s'il existe
    if [ -f "token.env" ]; then
        source token.env
    fi
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}Pas de token JWT. Connectez-vous d'abord.${NC}"
        return
    fi
    
    response=$(curl -s -X GET "$API_URL/users" \
      -H "Authorization: Bearer $TOKEN")
    
    echo -e "${GREEN}Réponse:${NC}"
    echo $response | jq '.'
}

# Fonction pour obtenir les détails d'un utilisateur
get_user() {
    echo -e "${BLUE}Détails d'un utilisateur${NC}"
    
    # Charger le token s'il existe
    if [ -f "token.env" ]; then
        source token.env
    fi
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}Pas de token JWT. Connectez-vous d'abord.${NC}"
        return
    fi
    
    if [ -z "$1" ]; then
        echo -e "${RED}ID utilisateur requis${NC}"
        return
    fi
    
    response=$(curl -s -X GET "$API_URL/users/$1" \
      -H "Authorization: Bearer $TOKEN")
    
    echo -e "${GREEN}Réponse:${NC}"
    echo $response | jq '.'
}

# Fonction pour vérifier le statut de l'API
check_status() {
    echo -e "${BLUE}Vérification du statut de l'API${NC}"
    
    # Tester l'API principale
    echo -e "${YELLOW}API principale:${NC}"
    curl -s -X GET "$API_URL/system/info" | jq '.'
    
    # Tester l'API de test
    echo -e "\n${YELLOW}API de test:${NC}"
    curl -s -X GET "$TEST_API_URL/system/info" | jq '.'
}

# Traitement des commandes
case "$1" in
    register)
        register
        ;;
    login)
        login
        ;;
    users)
        list_users
        ;;
    user)
        get_user "$2"
        ;;
    status)
        check_status
        ;;
    help|"")
        show_help
        ;;
    *)
        echo -e "${RED}Commande inconnue: $1${NC}"
        show_help
        exit 1
        ;;
esac