#!/bin/bash

# Fix permissions pour les répertoires de build et logs
echo "Fixing permissions for build and log directories..."

# Créer les répertoires nécessaires
mkdir -p dist/tests/utils dist/tests/mocks logs

# Donner les permissions correctes
chmod -R 755 dist logs

echo "File structure and permissions set up correctly."