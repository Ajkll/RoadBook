#!/bin/bash

echo "==== Lancement de l'environnement de test complet ===="

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
  echo "Erreur: Docker n'est pas en cours d'exécution. Veuillez démarrer Docker."
  exit 1
fi

# Arrêter les serveurs existants si nécessaire
if lsof -i:4001 > /dev/null 2>&1; then
  echo "Arrêt du serveur existant sur le port 4001..."
  kill $(lsof -t -i:4001) 2>/dev/null || true
fi

# Vérifier et démarrer PostgreSQL si nécessaire
if ! docker ps | grep -q postgres; then
  echo "Démarrage du conteneur PostgreSQL..."
  docker-compose up -d postgres
  
  # Attendre que la base de données soit prête
  echo "Attente que la base de données soit prête..."
  sleep 5
fi

# Compiler le code TypeScript
echo "Compilation du code TypeScript..."
npm run build

# Générer le client Prisma
echo "Génération du client Prisma..."
npx prisma generate

# Exécuter les migrations
echo "Exécution des migrations..."
npx prisma migrate deploy

# Démarrer Prisma Studio dans un nouvel onglet de terminal si possible
echo "Démarrage de Prisma Studio (port 5555)..."
if command -v gnome-terminal &> /dev/null; then
  gnome-terminal -- bash -c "cd $(pwd) && npx prisma studio" &
elif command -v xterm &> /dev/null; then
  xterm -e "cd $(pwd) && npx prisma studio" &
else
  echo "Prisma Studio n'a pas pu être démarré automatiquement."
  echo "Veuillez l'exécuter manuellement avec: npx prisma studio"
fi

# Démarrer le serveur de test
echo "Démarrage du serveur API de test (port 4001)..."
node test-server.js