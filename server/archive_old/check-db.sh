#!/bin/bash

# Script pour vérifier le contenu de la base de données
# =====================================================
# Ce script récupère et affiche les entrées des tables principales
# pour vérifier que les données ont été correctement chargées

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Vérification du contenu de la base de données RoadBook =====${NC}"

# Fonction pour vérifier une table
check_table() {
  local table=$1
  local display_name=$2
  
  echo -e "${YELLOW}Vérification de la table ${display_name}...${NC}"
  
  # Exécuter la requête dans le conteneur Docker
  local count=$(docker exec server-dev npx prisma db execute --command "SELECT COUNT(*) FROM \"$table\"" --json 2>/dev/null | grep -o '[0-9]\+' || echo "0")
  
  # Afficher le résultat
  if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}✅ $count entrées trouvées dans la table ${display_name}${NC}"
    return 0
  else
    echo -e "${RED}❌ Aucune entrée trouvée dans la table ${display_name}${NC}"
    return 1
  fi
}

# Vérifier si le conteneur Docker est en cours d'exécution
if ! docker ps | grep -q "server-dev"; then
  echo -e "${RED}❌ Le conteneur server-dev n'est pas en cours d'exécution.${NC}"
  echo -e "${YELLOW}Veuillez démarrer l'environnement de développement avec ./launch-dev.sh${NC}"
  exit 1
fi

# Vérifier chaque table
check_table "User" "Utilisateurs"
check_table "RoadBook" "Carnets de route"
check_table "Session" "Sessions"
check_table "Competency" "Compétences"
check_table "CompetencyProgress" "Progression des compétences"

# Récupérer la liste des utilisateurs
echo -e "\n${YELLOW}Liste des utilisateurs dans la base de données:${NC}"
docker exec server-dev npx prisma db execute --command "SELECT id, email, \"displayName\", role FROM \"User\" LIMIT 10" --json | jq '.[].values | {id: .[0], email: .[1], displayName: .[2], role: .[3]}' 2>/dev/null || echo -e "${RED}Impossible de récupérer la liste des utilisateurs${NC}"

echo -e "\n${BLUE}===== Vérification terminée =====${NC}"