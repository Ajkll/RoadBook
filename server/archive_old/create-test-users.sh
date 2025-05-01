#!/bin/bash

# Script pour créer des utilisateurs de test directement via l'API
# Contrairement au seed qui cause un crash avec erreur de segmentation

echo "Création des utilisateurs de test..."

# Créer un utilisateur apprenti
echo "Création de l'utilisateur apprenti..."
curl -s -X POST "http://localhost:4000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apprentice@roadbook.com",
    "password": "Password123!",
    "displayName": "Apprentice User",
    "role": "APPRENTICE"
  }'
echo -e "\n"

# Créer un utilisateur guide
echo "Création de l'utilisateur guide..."
curl -s -X POST "http://localhost:4000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guide@roadbook.com",
    "password": "Password123!",
    "displayName": "Guide User",
    "role": "GUIDE"
  }'
echo -e "\n"

# Créer un utilisateur admin
echo "Création de l'utilisateur admin..."
curl -s -X POST "http://localhost:4000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@roadbook.com",
    "password": "Password123!",
    "displayName": "Admin User",
    "role": "ADMIN"
  }'
echo -e "\n"

echo "Les utilisateurs de test ont été créés avec succès!"
echo "Vous pouvez maintenant vous connecter à l'application avec les identifiants suivants:"
echo "- apprentice@roadbook.com / Password123!"
echo "- guide@roadbook.com / Password123!"
echo "- admin@roadbook.com / Password123!"