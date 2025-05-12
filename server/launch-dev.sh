#!/bin/bash

# Script de lancement du serveur de développement sur le port 4002

echo "===== Lancement du serveur de développement RoadBook ====="

# 1. Vérifier si un processus utilise déjà le port 4002
if lsof -i:4002 > /dev/null 2>&1; then
  echo "⚠️  Le port 4002 est déjà utilisé. Arrêt du processus..."
  kill $(lsof -t -i:4002) 2>/dev/null || true
  sleep 1
fi

# 2. Vérifier si le client Prisma est généré
if [ ! -d "node_modules/.prisma" ]; then
  echo "🔄 Génération du client Prisma..."
  npx prisma generate
fi

# 3. Demander si la migration doit être effectuée
read -p "Appliquer les migrations Prisma ? (y/n): " run_migrate
if [ "$run_migrate" = "y" ]; then
  echo "🔄 Application des migrations Prisma..."
  npx prisma migrate dev
  
  # 4. Demander si le seed doit être effectué
  read -p "Seed la base de données avec des données de test ? (y/n): " run_seed
  if [ "$run_seed" = "y" ]; then
    echo "🌱 Seed de la base de données..."
    npx prisma db seed
  fi
fi

# 5. Démarrer Prisma Studio en arrière-plan
echo "🔍 Démarrage de Prisma Studio en arrière-plan..."
(npx prisma studio > /dev/null 2>&1 &)
echo "✅ Prisma Studio démarré sur http://localhost:5555"

# 6. Démarrer le serveur de développement
echo "🚀 Démarrage du serveur de développement API..."
echo "✅ API disponible sur http://localhost:4002/api"
echo "===== Environnement de développement prêt ! ====="
npm run dev