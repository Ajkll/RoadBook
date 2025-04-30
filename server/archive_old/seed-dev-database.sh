#!/bin/bash

##############################################################################
# Script de remplissage de la base de données de développement
# ============================================================
#
# Ce script remplit la base de données avec des données de test pour faciliter
# le développement et le test de l'API.
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

echo -e "${BLUE}===== Remplissage de la base de données de développement =====${NC}"

# Vérifier si la base de données est accessible
echo -e "${YELLOW}🔍 Vérification de la connexion à la base de données...${NC}"

# Configuration de la base de données
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/roadbook_dev"

# Vérifier la connexion PostgreSQL
if ! command -v pg_isready >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️ La commande pg_isready n'est pas disponible, vérification alternative...${NC}"
  # Vérification alternative avec psql
  if ! command -v psql >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ La commande psql n'est pas disponible, utilisation de npx prisma...${NC}"
    # Vérification avec Prisma
    if ! npx prisma db pull --schema=./prisma/schema.prisma >/dev/null 2>&1; then
      echo -e "${RED}❌ La base de données n'est pas accessible.${NC}"
      echo -e "${YELLOW}🔄 Assurez-vous que Docker est en cours d'exécution et que la base de données est démarrée:${NC}"
      echo -e "${YELLOW}   → docker-compose -f docker-compose.dev.yml up -d postgres-dev${NC}"
      exit 1
    fi
  else
    if ! psql "$DATABASE_URL" -c '\conninfo' >/dev/null 2>&1; then
      echo -e "${RED}❌ La base de données n'est pas accessible.${NC}"
      echo -e "${YELLOW}🔄 Assurez-vous que Docker est en cours d'exécution et que la base de données est démarrée:${NC}"
      echo -e "${YELLOW}   → docker-compose -f docker-compose.dev.yml up -d postgres-dev${NC}"
      exit 1
    fi
  fi
else
  if ! pg_isready -h localhost -p 5433 -U postgres >/dev/null 2>&1; then
    echo -e "${RED}❌ La base de données n'est pas accessible.${NC}"
    echo -e "${YELLOW}🔄 Assurez-vous que Docker est en cours d'exécution et que la base de données est démarrée:${NC}"
    echo -e "${YELLOW}   → docker-compose -f docker-compose.dev.yml up -d postgres-dev${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Connexion à la base de données établie.${NC}"

# Appliquer les migrations
echo -e "${YELLOW}🔄 Application des migrations...${NC}"
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors de l'application des migrations.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Migrations appliquées avec succès.${NC}"

# Générer le client Prisma
echo -e "${YELLOW}🔄 Génération du client Prisma...${NC}"
npx prisma generate

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors de la génération du client Prisma.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Client Prisma généré avec succès.${NC}"

# Exécuter le seed
echo -e "${YELLOW}🔄 Remplissage de la base de données avec les données de test...${NC}"
npx prisma db seed

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erreur lors du remplissage de la base de données.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Base de données remplie avec succès.${NC}"

# Afficher les informations sur les données
echo -e "\n${BLUE}💾 Données disponibles dans la base de données:${NC}"
echo -e "   → Utilisateurs: ${GREEN}user@roadbook.com${NC}, ${GREEN}guide@roadbook.com${NC}, ${GREEN}admin@roadbook.com${NC}"
echo -e "   → Mot de passe (pour tous): ${GREEN}Password123!${NC}"
echo -e "   → RoadBooks, compétences, badges et autres données de test"
echo -e "   → Accédez à ces données via Prisma Studio: ${GREEN}http://localhost:5555${NC}"

echo -e "\n${BLUE}🚀 La base de données est prête pour le développement et les tests!${NC}"