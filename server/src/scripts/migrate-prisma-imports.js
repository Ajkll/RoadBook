#!/usr/bin/env node

/**
 * Script de migration pour les imports Prisma
 * ==========================================
 * 
 * Ce script parcourt tous les fichiers .ts du projet et met à jour:
 * 1. Les imports de logger qui utilisent `{ logger }` vers `logger`
 * 2. Les imports de prisma-manager qui utilisent `{ prismaManager }` vers `prismaManager`
 * 
 * Usage:
 * node migrate-prisma-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chemins à exclure
const EXCLUDED_DIRS = ['node_modules', 'dist', '.git'];

// Extensions à traiter
const EXTENSIONS = ['.ts'];

// Fonction pour parcourir récursivement un répertoire
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    
    if (isDirectory) {
      if (!EXCLUDED_DIRS.includes(f)) {
        walkDir(dirPath, callback);
      }
      return;
    }
    
    const ext = path.extname(f);
    if (EXTENSIONS.includes(ext)) {
      callback(path.join(dir, f));
    }
  });
}

// Fonction pour mettre à jour les imports dans un fichier
function updateFileImports(filePath) {
  console.log(`Traitement du fichier: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Mettre à jour les imports logger
  if (content.includes('import { logger } from \'../utils/logger\'') || 
      content.includes('import { logger } from "../utils/logger"')) {
    content = content.replace(
      /import\s+{\s*logger\s*}\s+from\s+(['"])(.+?)\/utils\/logger\1/g,
      'import logger from $1$2/utils/logger$1'
    );
    modified = true;
  }
  
  // Mettre à jour les imports prismaManager
  if (content.includes('import { prismaManager }') || 
      content.includes('import {prismaManager}')) {
    content = content.replace(
      /import\s+{\s*prismaManager\s*}\s+from\s+(['"])(.+?)\/config\/prisma-manager\1/g,
      'import prismaManager from $1$2/config/prisma-manager$1'
    );
    modified = true;
  }
  
  // Mettre à jour les imports prisma
  const prismaImportRegex = /import\s+{\s*prisma\s*(?:,\s*([^}]*))?}\s+from\s+(['"])(.+?)\/config\/prisma\2/g;
  if (prismaImportRegex.test(content)) {
    content = content.replace(
      prismaImportRegex,
      (match, otherImports, quote, path) => {
        if (otherImports) {
          return `import prisma, { ${otherImports} } from ${quote}${path}/config/prisma${quote}`;
        } else {
          return `import prisma from ${quote}${path}/config/prisma${quote}`;
        }
      }
    );
    modified = true;
  }
  
  // Sauvegarder les modifications
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Mise à jour effectuée`);
  } else {
    console.log(`  ⏭️ Aucune modification nécessaire`);
  }
}

// Point d'entrée principal
function main() {
  console.log('🔍 Migration des imports Prisma et Logger');
  console.log('=========================================');
  
  const rootDir = path.resolve(__dirname, '../../');
  console.log(`Répertoire racine: ${rootDir}`);
  
  let fileCount = 0;
  let modifiedCount = 0;
  
  walkDir(rootDir, filePath => {
    fileCount++;
    
    const contentBefore = fs.readFileSync(filePath, 'utf8');
    updateFileImports(filePath);
    const contentAfter = fs.readFileSync(filePath, 'utf8');
    
    if (contentBefore !== contentAfter) {
      modifiedCount++;
    }
  });
  
  console.log('\n✅ Migration terminée');
  console.log(`📊 Statistiques:`);
  console.log(`   - Fichiers analysés: ${fileCount}`);
  console.log(`   - Fichiers modifiés: ${modifiedCount}`);
  
  console.log('\n🔄 Exécution de la vérification TypeScript...');
  
  try {
    execSync('cd ../.. && npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ La vérification TypeScript est terminée sans erreur.');
  } catch (error) {
    console.error('❌ Des erreurs TypeScript subsistent. Vérifiez la sortie ci-dessus.');
    console.log('\n⚠️ Corrections manuelles potentiellement nécessaires:');
    console.log('1. Pour les objets prisma.<model>, vérifiez que le modèle est correctement utilisé');
    console.log('2. Pour les méthodes spéciales comme $connect, $disconnect, utilisez await getPrismaClient() puis appelez la méthode');
    console.log('3. Pour les références au mauvais chemin de module, corrigez les importations manuellement');
  }
}

// Exécuter le script
main();