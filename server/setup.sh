#!/bin/bash

# Script de configuration du serveur RoadBook
# Utilisation: ./setup.sh
#
# Ce script effectue les actions suivantes:
# 1. Vérifie les prérequis (Node.js, npm)
# 2. Installe les dépendances
# 3. Crée un fichier .env si nécessaire
# 4. Génère les clients Prisma
# 5. Crée la migration et initialise la base de données
# 6. Compile le code TypeScript

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RoadBook Server Setup ===${NC}"

# Vérifier si Node.js est installé
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js found:${NC} $NODE_VERSION"
else
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js 16 or higher.${NC}"
    exit 1
fi

# Vérifier si npm est installé
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm found:${NC} $NPM_VERSION"
else
    echo -e "${RED}✗ npm is not installed. Please install npm.${NC}"
    exit 1
fi

# Installer les dépendances
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cat > .env << EOL
# Server configuration
PORT=4000
NODE_ENV=development

# Database configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/roadbook?schema=public"

# JWT secrets
JWT_SECRET="your-jwt-secret-for-development"
JWT_REFRESH_SECRET="your-refresh-token-secret-for-development"

# CORS (comma-separated origins)
CORS_ORIGINS="http://localhost:19000,http://localhost:19006,http://localhost:3000,http://localhost:8081,exp://localhost:19000"
EOL
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Asking the user if they have PostgreSQL installed locally
echo -e "\n${YELLOW}Do you have PostgreSQL installed locally? (y/n)${NC}"
read -r has_postgres

if [ "$has_postgres" = "y" ] || [ "$has_postgres" = "Y" ]; then
    echo -e "\n${YELLOW}Generating Prisma client...${NC}"
    npx prisma generate

    echo -e "\n${YELLOW}Creating Prisma migration...${NC}"
    npx prisma migrate dev --name init

    echo -e "\n${YELLOW}Seeding the database...${NC}"
    npx prisma db seed
else
    echo -e "\n${YELLOW}Skipping database initialization.${NC}"
    echo -e "${YELLOW}You can run these commands later when you have PostgreSQL:${NC}"
    echo -e "npx prisma generate"
    echo -e "npx prisma migrate dev --name init"
    echo -e "npx prisma db seed"
    
    echo -e "\n${YELLOW}Alternatively, you can use Docker:${NC}"
    echo -e "docker-compose up -d"
fi

# Compiler le code TypeScript
echo -e "\n${YELLOW}Compiling TypeScript code...${NC}"
npm run build

echo -e "\n${GREEN}=== Setup complete ===${NC}"
echo -e "You can start the server with: ${YELLOW}npm run dev${NC}"
echo -e "API available at: ${YELLOW}http://localhost:4000/api${NC}"
echo -e "Test users:"
echo -e "  - ${YELLOW}apprentice@roadbook.com${NC} (APPRENTICE)"
echo -e "  - ${YELLOW}guide@roadbook.com${NC} (GUIDE)"
echo -e "  - ${YELLOW}instructor@roadbook.com${NC} (INSTRUCTOR)"
echo -e "  - ${YELLOW}admin@roadbook.com${NC} (ADMIN)"
echo -e "Password: ${YELLOW}Password123!${NC}"