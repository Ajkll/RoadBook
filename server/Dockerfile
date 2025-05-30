FROM node:18-alpine AS builder

# Installer les dépendances nécessaires
RUN apk add --no-cache python3 make g++ libc6-compat openssl

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY . .

# Compiler l'application
RUN npm run build:fast

# -------------------------------------------------------
# Étape de production - image plus légère
FROM node:18-alpine

# Installer les outils nécessaires
RUN apk add --no-cache openssl postgresql-client lsof

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Copier Prisma depuis l'étape de build
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/prisma /app/prisma

# Copier le code compilé et autres fichiers nécessaires
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/test-server.js /app/
COPY --from=builder /app/public /app/public

# Créer les répertoires nécessaires avec les bonnes permissions
RUN mkdir -p logs dist/tests/utils dist/tests/mocks && \
    chmod -R 777 logs

# Script d'attente pour la base de données et démarrage de l'application
RUN echo '#!/bin/sh \n\
echo "Waiting for PostgreSQL..." \n\
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do \n\
  echo "PostgreSQL is unavailable - sleeping" \n\
  sleep 2 \n\
done \n\
echo "PostgreSQL started" \n\
\n\
echo "Running migrations..." \n\
npx prisma migrate deploy \n\
\n\
if [ "$SEED_DATABASE" = "true" ]; then \n\
  echo "Seeding database..." \n\
  npx prisma db seed \n\
fi \n\
\n\
echo "Starting application based on NODE_ENV: $NODE_ENV" \n\
if [ "$TEST_API" = "true" ]; then \n\
  echo "Starting test API server..." \n\
  node test-server.js \n\
elif [ "$PRISMA_STUDIO" = "true" ]; then \n\
  echo "Starting Prisma Studio..." \n\
  npx prisma studio --port 5555 --hostname 0.0.0.0 \n\
else \n\
  if [ "$NODE_ENV" = "production" ]; then \n\
    echo "Starting in production mode..." \n\
    node dist/index.js \n\
  else \n\
    echo "Starting in development mode..." \n\
    npm run dev \n\
  fi \n\
fi \n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Variables d'environnement avec valeurs par défaut
ENV NODE_ENV=production \
    PORT=4000 \
    DB_HOST=postgres \
    DB_PORT=5432 \
    DB_USER=postgres \
    DB_PASS=postgres \
    DB_NAME=roadbook

# Exposer les ports
EXPOSE 4000 4001 5555

# Commande pour démarrer l'application
CMD ["/app/start.sh"]