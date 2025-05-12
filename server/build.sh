#!/bin/bash

# Installer les dépendances, y compris les types
npm install
npm install --save-dev @types/node @types/express @types/cors @types/cookie-parser @types/bcrypt @types/jsonwebtoken @types/uuid @types/jest @types/winston

# Générer le client Prisma
npx prisma generate

# Compiler avec TypeScript
npm run build:fast