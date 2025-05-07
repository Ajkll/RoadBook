#!/bin/bash

##############################################################################
# Script de lancement de l'environnement de développement complet
# =====================================================================
#
# Ce script lance en parallèle:
# - Base de données PostgreSQL (port 5432)
# - Le serveur d'API de développement principal (port 4000)
# - L'interface de test d'API (port 4001)
# - Prisma Studio pour explorer la base de données (port 5555)
#
# Auteur: Équipe RoadBook
# Date: Avril 2025
##############################################################################

echo "===== Lancement de l'environnement de développement complet ====="

# Vérifier si Docker est installé
if ! command -v docker >/dev/null 2>&1; then
  echo "⚠️  Docker n'est pas installé. Veuillez installer Docker."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "⚠️  Le service Docker n'est pas démarré. Veuillez démarrer Docker."
  exit 1
fi

# Vérifier si Node.js est installé
if ! command -v node >/dev/null 2>&1; then
  echo "⚠️  Node.js n'est pas installé. Veuillez installer Node.js."
  exit 1
fi

# Vérifier si les modules sont installés
if [ ! -d "node_modules" ]; then
  echo "🔄 Installation des dépendances..."
  npm install
fi

# Variables pour la gestion des processus
SERVER_PID=""
TEST_SERVER_PID=""
PRISMA_STUDIO_PID=""
DB_CONTAINER_NAME="roadbook-postgres-dev"

# Fonction pour stopper les serveurs et conteneurs lors de la sortie
function cleanup() {
  echo -e "\n🛑 Arrêt des serveurs et conteneurs..."
  
  if [ ! -z "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null || true
    echo "✅ Serveur API arrêté"
  fi
  
  if [ ! -z "$TEST_SERVER_PID" ]; then
    kill $TEST_SERVER_PID 2>/dev/null || true
    echo "✅ Serveur de test arrêté"
  fi
  
  if [ ! -z "$PRISMA_STUDIO_PID" ]; then
    kill $PRISMA_STUDIO_PID 2>/dev/null || true
    echo "✅ Prisma Studio arrêté"
  fi
  
  # Ne pas arrêter la base de données pour éviter de perdre les données
  # Si vous voulez l'arrêter, décommentez la ligne ci-dessous
  # docker stop $DB_CONTAINER_NAME 2>/dev/null || true
  
  echo "===== Environnement arrêté ====="
  exit 0
}

# Capture Ctrl+C pour un arrêt propre
trap cleanup EXIT INT TERM

# Fonction pour vérifier si un port est disponible
function is_port_available() {
  nc -z localhost $1 >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "⚠️  Le port $1 est déjà utilisé."
    return 1
  fi
  return 0
}

# Gérer les ports utilisés
function kill_process_on_port() {
  local port=$1
  local pid=$(lsof -t -i:$port)
  
  if [ ! -z "$pid" ]; then
    echo "⚠️  Port $port est utilisé par le processus $pid. Tentative d'arrêt..."
    kill -9 $pid 2>/dev/null
    sleep 1
    if ! is_port_available $port; then
      echo "❌ Impossible de libérer le port $port."
      return 1
    else
      echo "✅ Port $port libéré."
      return 0
    fi
  fi
  return 0
}

# Libérer les ports si nécessaire
kill_process_on_port 4000
kill_process_on_port 4001
kill_process_on_port 5555
kill_process_on_port 5432

# 1. Vérifier et démarrer la base de données PostgreSQL
echo "🔄 Vérification de la base de données PostgreSQL..."

# Vérifier si le conteneur existe déjà
if docker ps -a | grep -q $DB_CONTAINER_NAME; then
  # Si le conteneur existe, vérifier s'il est en cours d'exécution
  if docker ps | grep -q $DB_CONTAINER_NAME; then
    echo "✅ Conteneur PostgreSQL déjà démarré."
  else
    echo "🔄 Redémarrage du conteneur PostgreSQL..."
    docker start $DB_CONTAINER_NAME
    if [ $? -ne 0 ]; then
      echo "❌ Impossible de démarrer le conteneur PostgreSQL. Suppression et recréation..."
      docker rm $DB_CONTAINER_NAME
      docker run --name $DB_CONTAINER_NAME -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=roadbook -p 5432:5432 -d postgres:14
    fi
  fi
else
  # Créer un nouveau conteneur PostgreSQL
  echo "🔄 Création d'un nouveau conteneur PostgreSQL..."
  docker run --name $DB_CONTAINER_NAME -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=roadbook -p 5432:5432 -d postgres:14
fi

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente que PostgreSQL soit prêt..."
for i in {1..30}; do
  if docker exec $DB_CONTAINER_NAME pg_isready -h localhost -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL est prêt!"
    break
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 30 ]; then
    echo "❌ PostgreSQL n'est pas prêt après 30 secondes. Abandon."
    exit 1
  fi
done

# 2. Compiler le projet avec les bons droits
echo "🔄 Compilation du projet..."
mkdir -p dist/tests/utils
chmod -R 777 dist/
npm run build:fast

if [ $? -ne 0 ]; then
  echo "❌ Erreur de compilation. Correction nécessaire avant de continuer."
  exit 1
fi

# 3. Exécuter les migrations de base de données si nécessaire
echo "🔄 Vérification des migrations de base de données..."

# Créer un .env temporaire pour s'assurer que l'URL de la base de données est correcte
cat > .env.temp << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/roadbook"
EOF

# Utiliser le .env temporaire pour les migrations
export NODE_ENV=development
export PRISMA_SCHEMA_FILE=./prisma/schema.prisma

echo "🔄 Application des migrations Prisma..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

if [ $? -ne 0 ]; then
  echo "⚠️ Problème lors de l'application des migrations. Tentative de réinitialisation..."
  npx prisma migrate reset --force --schema=./prisma/schema.prisma
fi

echo "🔄 Génération du client Prisma..."
npx prisma generate --schema=./prisma/schema.prisma

# 4. Démarrer l'API principale en arrière-plan
echo "🚀 Démarrage du serveur d'API (port 4000)..."

# Environnement pour le serveur
export PORT=4000
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/roadbook"
export JWT_SECRET="dev-jwt-secret-for-local-testing-only"
export JWT_REFRESH_SECRET="dev-refresh-token-secret-for-local-testing-only"

npm run dev &
SERVER_PID=$!

# Attendre que le processus démarre
echo "⏳ Attente du démarrage du serveur d'API..."
for i in {1..15}; do
  if kill -0 $SERVER_PID 2>/dev/null; then
    # Vérifier si le serveur répond
    if nc -z localhost 4000 >/dev/null 2>&1; then
      echo "✅ Serveur d'API démarré (PID: $SERVER_PID)"
      break
    fi
  else
    echo "❌ Échec du démarrage du serveur d'API."
    exit 1
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 15 ]; then
    echo "⚠️ Le serveur d'API ne répond pas encore, mais on continue..."
  fi
done

# 5. Démarrer le serveur de test API en arrière-plan
echo "🚀 Démarrage de l'interface de test (port 4001)..."

# Environnement pour le serveur de test
export PORT=4001
export TEST_PORT=4001
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/roadbook"

node test-server.js &
TEST_SERVER_PID=$!

# Attendre que le processus démarre
echo "⏳ Attente du démarrage de l'interface de test..."
for i in {1..15}; do
  if kill -0 $TEST_SERVER_PID 2>/dev/null; then
    # Vérifier si le serveur répond
    if nc -z localhost 4001 >/dev/null 2>&1; then
      echo "✅ Interface de test API démarrée (PID: $TEST_SERVER_PID)"
      break
    fi
  else
    echo "❌ Échec du démarrage du serveur de test."
    kill $SERVER_PID 2>/dev/null
    exit 1
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 15 ]; then
    echo "⚠️ L'interface de test ne répond pas encore, mais on continue..."
  fi
done

# 6. Démarrer Prisma Studio pour explorer la base de données
echo "🚀 Démarrage de Prisma Studio (port 5555)..."

# Environnement pour Prisma Studio
export PRISMA_SCHEMA_FILE=./prisma/schema.prisma
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/roadbook"

npx prisma studio &
PRISMA_STUDIO_PID=$!

# Attendre que le processus démarre
echo "⏳ Attente du démarrage de Prisma Studio..."
for i in {1..10}; do
  if kill -0 $PRISMA_STUDIO_PID 2>/dev/null; then
    if nc -z localhost 5555 >/dev/null 2>&1; then
      echo "✅ Prisma Studio démarré (PID: $PRISMA_STUDIO_PID)"
      break
    fi
  else
    echo "⚠️ Prisma Studio n'a pas démarré correctement."
    break
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 10 ]; then
    echo "⚠️ Prisma Studio ne répond pas encore, mais on continue..."
  fi
done

# 7. Afficher les URLs et instructions
echo -e "\n📱 Interfaces disponibles:"
echo "   → API principale: http://localhost:4000/api"
echo "   → Interface de test: http://localhost:4001"
echo "   → Prisma Studio: http://localhost:5555"
echo -e "\n💾 Base de données PostgreSQL:"
echo "   → Hôte: localhost"
echo "   → Port: 5432"
echo "   → Utilisateur: postgres"
echo "   → Mot de passe: postgres"
echo "   → Base de données: roadbook"

# 6. Attendre que l'utilisateur appuie sur Ctrl+C
echo -e "\n💡 Appuyez sur Ctrl+C pour arrêter les serveurs"
echo "===== Environnement complet démarré ====="

# Boucle d'attente de tous les processus
wait $SERVER_PID $TEST_SERVER_PID $PRISMA_STUDIO_PID