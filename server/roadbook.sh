#!/bin/bash

# Script d'aide pour le développement RoadBook server
# Centralise toutes les commandes courantes pour faciliter le développement

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
    echo -e "${BLUE}===== RoadBook - Utilitaire de développement =====${NC}"
    echo ""
    echo -e "Usage: ${YELLOW}./roadbook.sh${NC} ${GREEN}[commande]${NC}"
    echo ""
    echo -e "${BLUE}Commandes de développement:${NC}"
    echo -e "  ${GREEN}dev${NC}               Démarrer le serveur de développement (avec conteneur Docker)"
    echo -e "  ${GREEN}build${NC}             Construire le projet pour production"
    echo -e "  ${GREEN}start${NC}             Démarrer le serveur en mode production"
    echo ""
    echo -e "${BLUE}Commandes de base de données:${NC}"
    echo -e "  ${GREEN}migrate${NC}           Exécuter les migrations Prisma"
    echo -e "  ${GREEN}seed${NC}              Alimenter la base de données avec les données de test"
    echo -e "  ${GREEN}prisma:studio${NC}     Lancer l'interface Prisma Studio"
    echo ""
    echo -e "${BLUE}Commandes de test:${NC}"
    echo -e "  ${GREEN}test${NC}              Exécuter les tests standard"
    echo -e "  ${GREEN}test:containers${NC}   Exécuter les tests avec testcontainers (isolation complète)"
    echo -e "  ${GREEN}test:watch${NC}        Exécuter les tests en mode watch"
    echo -e "  ${GREEN}test:api${NC}          Lancer le serveur de test API (interface de test)"
    echo ""
    echo -e "${BLUE}Commandes Docker:${NC}"
    echo -e "  ${GREEN}docker:up${NC}         Démarrer les conteneurs Docker uniquement"
    echo -e "  ${GREEN}docker:down${NC}       Arrêter les conteneurs Docker"
    echo -e "  ${GREEN}docker:logs${NC}       Afficher les logs des conteneurs"
    echo ""
    echo -e "${BLUE}Divers:${NC}"
    echo -e "  ${GREEN}help${NC}              Afficher ce message d'aide"
    echo -e "  ${GREEN}clean${NC}             Nettoyer les fichiers temporaires et le cache"
    echo ""
}

# Vérifier si Docker est installé et en cours d'exécution
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        echo -e "${RED}⚠️  Docker n'est pas installé. Veuillez installer Docker.${NC}"
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}⚠️  Le service Docker n'est pas démarré. Veuillez démarrer Docker.${NC}"
        exit 1
    fi
}

# Démarrer les conteneurs Docker
docker_up() {
    echo -e "${BLUE}===== Démarrage des conteneurs Docker =====${NC}"
    check_docker
    
    if ! docker ps | grep -q postgres; then
        echo -e "${YELLOW}🔄 Démarrage du conteneur PostgreSQL...${NC}"
        docker-compose up -d postgres
        
        # Attendre que le conteneur soit prêt
        echo -e "${YELLOW}⏳ Attente que PostgreSQL soit prêt...${NC}"
        sleep 5
        
        if docker ps | grep -q postgres; then
            echo -e "${GREEN}✅ Conteneur PostgreSQL démarré avec succès!${NC}"
        else
            echo -e "${RED}❌ Échec du démarrage du conteneur PostgreSQL.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Conteneur PostgreSQL déjà en cours d'exécution.${NC}"
    fi
}

# Arrêter les conteneurs Docker
docker_down() {
    echo -e "${BLUE}===== Arrêt des conteneurs Docker =====${NC}"
    check_docker
    
    echo -e "${YELLOW}🔄 Arrêt des conteneurs...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Conteneurs arrêtés avec succès!${NC}"
}

# Nettoyer les fichiers temporaires
clean() {
    echo -e "${BLUE}===== Nettoyage des fichiers temporaires =====${NC}"
    
    # Supprimer les fichiers de compilation
    if [ -d "dist" ]; then
        echo -e "${YELLOW}🔄 Suppression des fichiers de compilation...${NC}"
        rm -rf dist
    fi
    
    # Supprimer les fichiers de sauvegarde
    echo -e "${YELLOW}🔄 Suppression des fichiers de sauvegarde...${NC}"
    find . -name "*.bak" -type f -delete
    
    echo -e "${GREEN}✅ Nettoyage terminé!${NC}"
}

# Afficher les logs des conteneurs
docker_logs() {
    echo -e "${BLUE}===== Logs des conteneurs Docker =====${NC}"
    check_docker
    
    docker-compose logs -f
}

# Gestion des commandes
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

# Traitement des commandes
case "$1" in
    dev)
        ./launch-dev.sh
        ;;
    test)
        npm test
        ;;
    test:containers)
        ./launch-test-containers.sh
        ;;
    test:watch)
        npm run test:watch
        ;;
    test:api)
        npm run test:api
        ;;
    migrate)
        npx prisma migrate dev
        ;;
    seed)
        npx prisma db seed
        ;;
    docker:up)
        docker_up
        ;;
    docker:down)
        docker_down
        ;;
    docker:logs)
        docker_logs
        ;;
    prisma:studio)
        npx prisma studio
        ;;
    build)
        npm run build
        ;;
    start)
        npm start
        ;;
    clean)
        clean
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Commande non reconnue: $1${NC}"
        show_help
        exit 1
        ;;
esac

exit 0