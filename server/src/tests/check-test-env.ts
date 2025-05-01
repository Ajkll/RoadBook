/**
 * Script de vérification de l'environnement de test
 * ================================================
 * 
 * Ce script peut être exécuté avant les tests pour vérifier que 
 * l'environnement est correctement configuré.
 * 
 * Usage:
 * ```
 * npm run check-test-env
 * ```
 * 
 * @module tests/check-test-env
 */

import { checkTestReadiness } from './utils/test-logger';

// Fonction principale
async function main() {
  console.log('Vérification de l\'environnement de test...');
  
  // Vérifier tous les aspects de l'environnement
  const isReady = await checkTestReadiness({
    testDatabase: true, 
    testServer: true,
    testAPIs: true
  });
  
  // Sortir avec un code d'erreur si l'environnement n'est pas prêt
  if (!isReady) {
    process.exit(1);
  }
  
  // Tout est prêt, sortir avec succès
  process.exit(0);
}

// Exécuter le script
main().catch(error => {
  console.error('Erreur lors de la vérification de l\'environnement:', error);
  process.exit(1);
});