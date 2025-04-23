#!/bin/bash

# Script de lancement du serveur de développement sur le port 4002
# Ce script gère le démarrage de l'environnement de développement complet avec Docker

echo "===== Lancement du serveur de développement RoadBook ====="

# 1. Vérifier si Docker est installé et en cours d'exécution
if ! command -v docker >/dev/null 2>&1; then
  echo "⚠️  Docker n'est pas installé. Veuillez installer Docker."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "⚠️  Le service Docker n'est pas démarré. Veuillez démarrer Docker."
  exit 1
fi

# 2. Vérifier et démarrer le conteneur PostgreSQL
if ! docker ps | grep -q postgres; then
  echo "🔄 Démarrage de la base de données PostgreSQL..."
  docker-compose up -d postgres
  
  # Attendre que PostgreSQL soit prêt
  echo "⏳ Attente du démarrage de PostgreSQL..."
  sleep 5
  
  if ! docker ps | grep -q postgres; then
    echo "❌ Erreur: Le conteneur PostgreSQL n'a pas démarré correctement."
    exit 1
  fi
  echo "✅ PostgreSQL démarré avec succès"
else
  echo "✅ PostgreSQL est déjà en cours d'exécution"
fi

# 3. Libérer le port 4002 si nécessaire
if lsof -i:4002 > /dev/null 2>&1; then
  echo "⚠️  Le port 4002 est déjà utilisé. Libération du port..."
  kill $(lsof -t -i:4002) 2>/dev/null || true
  sleep 1
fi

# 4. Générer le client Prisma si nécessaire
if [ ! -d "node_modules/.prisma" ]; then
  echo "🔄 Génération du client Prisma..."
  npx prisma generate
fi

# 5. Vérifier que la base de données est accessible
echo "🔄 Test de connexion à la base de données..."
if ! docker exec postgres pg_isready -U postgres > /dev/null 2>&1; then
  echo "❌ Impossible de se connecter à PostgreSQL."
  exit 1
fi
echo "✅ Base de données accessible"

# 6. Temporairement modifier DATABASE_URL pour utiliser localhost
# Cela est nécessaire car nous exécutons le serveur sur l'hôte, pas dans Docker
if grep -q "postgres:5432" .env; then
  echo "🔄 Configuration temporaire de la connexion à la base de données..."
  sed -i.bak 's|postgresql://postgres:postgres@postgres:5432/roadbook|postgresql://postgres:postgres@localhost:5432/roadbook|g' .env
  echo "✅ URL de base de données configurée pour l'hôte local"
fi

# 7. Demander si les migrations doivent être appliquées
read -p "Appliquer les migrations Prisma ? (y/n): " run_migrate
if [ "$run_migrate" = "y" ]; then
  echo "🔄 Application des migrations Prisma..."
  npx prisma migrate dev
  
  # 8. Demander si le seed doit être effectué
  read -p "Alimenter la base de données avec des données de test ? (y/n): " run_seed
  if [ "$run_seed" = "y" ]; then
    echo "🌱 Alimentation de la base de données..."
    npx prisma db seed
  fi
fi

# 9. Démarrer Prisma Studio en arrière-plan
echo "🔍 Démarrage de Prisma Studio en arrière-plan..."
(npx prisma studio > /dev/null 2>&1 &)
echo "✅ Prisma Studio accessible sur http://localhost:5555"

# 10. Démarrer le serveur de test API en arrière-plan
echo "🔍 Démarrage du serveur de test API en arrière-plan..."
(npm run test:api > /dev/null 2>&1 &)
sleep 2
echo "✅ Interface de test API disponible sur http://localhost:4001"

# 11. Démarrer le serveur de développement
echo "🚀 Démarrage du serveur de développement..."
echo "✅ API accessible sur http://localhost:4002/api"
echo "===== Environnement de développement prêt ! ====="
npm run dev