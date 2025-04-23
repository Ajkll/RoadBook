#!/bin/bash

# Script pour lancer les tests avec testcontainers
# Ce script utilise des conteneurs Docker éphémères créés à la volée pour chaque test

echo "===== Lancement des tests avec testcontainers ====="

# 1. Vérifier si Docker est installé et en cours d'exécution
if ! command -v docker >/dev/null 2>&1; then
  echo "⚠️  Docker n'est pas installé. Veuillez installer Docker."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "⚠️  Le service Docker n'est pas démarré. Veuillez démarrer Docker."
  exit 1
fi

# 2. Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo "🔄 Installation des dépendances..."
  npm install
fi

# 3. Générer le client Prisma si nécessaire
if [ ! -d "node_modules/.prisma" ]; then
  echo "🔄 Génération du client Prisma..."
  npx prisma generate
fi

# 4. Créer le fichier temporaire pour le setup global de Jest
echo "🔄 Configuration de l'environnement de test..."

cat > jest.setup.global.ts << EOF
import { GenericContainer, Wait } from 'testcontainers';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Variables globales pour stocker les références des conteneurs
let container: any;

// Setup global - exécuté une fois avant tous les tests
export default async function() {
  console.log('🐳 Démarrage de l\'environnement de test avec testcontainers...');
  
  try {
    // Créer un conteneur PostgreSQL éphémère
    container = await new GenericContainer('postgres:14')
      .withExposedPorts(5432)
      .withEnvironment({
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_DB: 'roadbook_test',
      })
      .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
      .start();
    
    // Récupérer les informations de connexion
    const host = container.getHost();
    const port = container.getMappedPort(5432);
    
    // Configurer l'URL de la base de données pour les tests
    process.env.DATABASE_URL = \`postgresql://postgres:postgres@\${host}:\${port}/roadbook_test\`;
    process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
    
    console.log(\`🐘 PostgreSQL démarré sur \${host}:\${port}\`);
    
    // Initialiser la base de données de test
    console.log('🔄 Initialisation de la base de données de test...');
    
    // Pousser le schéma vers la base de données de test
    execSync('npx prisma db push --force-reset --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log('✅ Base de données de test initialisée');
    
    // Stocker la référence du conteneur pour le nettoyage
    global.__TESTCONTAINERS__ = { container };
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    throw error;
  }
}

// Fonction de nettoyage - utilisée par le teardown global
export async function teardownTestEnv() {
  console.log('🧹 Nettoyage de l\'environnement de test...');
  
  if (global.__TESTCONTAINERS__?.container) {
    await global.__TESTCONTAINERS__.container.stop();
    console.log('✅ Conteneur PostgreSQL arrêté');
  }
}
EOF

# 5. Créer le fichier temporaire pour le teardown global de Jest
cat > jest.teardown.global.ts << EOF
import { teardownTestEnv } from './jest.setup.global';

export default async function() {
  await teardownTestEnv();
}
EOF

# 6. Créer une configuration Jest temporaire
CONFIG_TEMP=$(mktemp)
cat > $CONFIG_TEMP << EOF
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.ts'],
  globalSetup: '<rootDir>/jest.setup.global.ts',
  globalTeardown: '<rootDir>/jest.teardown.global.ts',
  testTimeout: 60000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts'
  ],
};
EOF

# 7. Sauvegarder la configuration Jest actuelle et utiliser la temporaire
if [ -f "jest.config.mjs" ]; then
  mv jest.config.mjs jest.config.mjs.bak
fi
mv $CONFIG_TEMP jest.config.mjs

# 8. Exécuter les tests
echo "🧪 Exécution des tests avec testcontainers..."
NODE_ENV=test npx jest --runInBand $@
TEST_RESULT=$?

# 9. Restaurer la configuration Jest originale
if [ -f "jest.config.mjs.bak" ]; then
  mv jest.config.mjs.bak jest.config.mjs
fi

# 10. Nettoyer les fichiers temporaires
rm -f jest.setup.global.ts jest.teardown.global.ts

# 11. Afficher le résultat des tests
if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ Tests réussis!"
else
  echo "❌ Des tests ont échoué."
fi

echo "===== Tests terminés ====="
exit $TEST_RESULT