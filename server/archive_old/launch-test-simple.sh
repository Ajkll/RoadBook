#!/bin/bash

# Script de lancement simplifié de l'environnement de test
# Sans dépendance sur Docker

echo "===== Lancement de l'environnement de test RoadBook ====="

# 1. Vérifier si un processus utilise déjà le port 4001
if lsof -i:4001 > /dev/null 2>&1; then
  echo "⚠️  Le port 4001 est déjà utilisé. Arrêt du processus..."
  kill $(lsof -t -i:4001) 2>/dev/null || true
  sleep 1
fi

# 2. Compiler le TypeScript
echo "🔨 Compilation du code TypeScript..."
npm run build

# 3. Vérifier si le client Prisma est généré
if [ ! -d "node_modules/.prisma" ]; then
  echo "🔄 Génération du client Prisma..."
  npx prisma generate
fi

# 4. Demander si la migration doit être effectuée
read -p "Appliquer les migrations Prisma ? (y/n): " run_migrate
if [ "$run_migrate" = "y" ]; then
  echo "🔄 Application des migrations Prisma..."
  npx prisma migrate dev
  
  # 5. Demander si le seed doit être effectué
  read -p "Seed la base de données avec des données de test ? (y/n): " run_seed
  if [ "$run_seed" = "y" ]; then
    echo "🌱 Seed de la base de données..."
    npx prisma db seed
  fi
fi

# 6. Démarrer Prisma Studio en arrière-plan
echo "🔍 Démarrage de Prisma Studio en arrière-plan..."
(npx prisma studio > /dev/null 2>&1 &)
echo "✅ Prisma Studio démarré sur http://localhost:5555"

# 7. Démarrer le serveur de test
echo "🚀 Démarrage du serveur de test API..."
echo "✅ Interface de test disponible sur http://localhost:4001"
echo "===== Environnement de test prêt ! ====="
node test-server.js