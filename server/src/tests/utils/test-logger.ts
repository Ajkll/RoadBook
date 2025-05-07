/**
 * Utilitaire de log pour les tests
 * ================================
 * 
 * Ce module fournit des fonctions d'aide pour améliorer la visibilité
 * et le rapport des tests en exécution.
 * 
 * Fonctionnalités:
 * - Logs colorés pour les différentes phases de test
 * - Formatage des informations de test
 * - Séparateurs visuels pour améliorer la lisibilité des rapports
 * - Vérification de préparation de l'environnement de test
 * 
 * @module tests/utils/test-logger
 */

// Constantes pour les couleurs
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  black: "\x1b[30m",
  
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

// Symboles pour les logs
const symbols = {
  info: 'ℹ',
  success: '✓',
  warn: '⚠',
  error: '✗',
  test: '🧪',
  database: '🗃️',
  server: '🚀',
  debug: '🔍',
};

/**
 * Types de tests pour le formatage
 */
export enum TestType {
  UNIT = "UNIT",
  INTEGRATION = "INTEGRATION",
  E2E = "E2E",
  CONTROLLER = "CONTROLLER",
  SERVICE = "SERVICE"
}

/**
 * Affiche un titre de section de test bien formaté
 * @param title Titre de la section
 * @param type Type de section (unit, integration, e2e)
 */
export function logTestSection(title: string, type: 'unit' | 'integration' | 'e2e'): void {
  const colorByType = {
    unit: colors.blue,
    integration: colors.magenta,
    e2e: colors.cyan,
  };
  
  const typeLabels = {
    unit: 'TEST UNITAIRE',
    integration: 'TEST D\'INTEGRATION',
    e2e: 'TEST END-TO-END',
  };
  
  console.log('\n' + '='.repeat(80));
  console.log(`${colorByType[type]}${colors.bright}${symbols.test} ${typeLabels[type]}: ${title}${colors.reset}`);
  console.log('-'.repeat(80));
}

/**
 * Affiche un message de log pour les tests
 * @param message Le message à afficher
 * @param level Niveau de log (info, success, error, warn)
 */
export function logTest(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const colorByLevel = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warn: colors.yellow,
  };
  
  const symbolByLevel = {
    info: symbols.info,
    success: symbols.success,
    error: symbols.error,
    warn: symbols.warn,
  };
  
  console.log(`${colorByLevel[level]}${colors.bright}${symbolByLevel[level]}${colors.reset} ${message}`);
}

/**
 * Affiche un log pour les opérations de base de données
 * @param message Le message décrivant l'opération
 * @param success Si l'opération a réussi
 */
export function logDatabase(message: string, success = true): void {
  const color = success ? colors.green : colors.red;
  const symbol = success ? symbols.success : symbols.error;
  
  console.log(`${color}${colors.bright}${symbols.database} ${symbol}${colors.reset} ${message}`);
}

/**
 * Affiche un log pour les opérations serveur
 * @param message Le message décrivant l'opération
 * @param success Si l'opération a réussi
 */
export function logServer(message: string, success = true): void {
  const color = success ? colors.green : colors.red;
  const symbol = success ? symbols.success : symbols.error;
  
  console.log(`${color}${colors.bright}${symbols.server} ${symbol}${colors.reset} ${message}`);
}

/**
 * Affiche un séparateur de résultat de test
 * @param success Si le test a réussi
 * @param message Message optionnel à afficher
 */
export function logTestResult(success: boolean, message?: string): void {
  const color = success ? colors.green : colors.red;
  const symbol = success ? symbols.success : symbols.error;
  const resultText = success ? 'SUCCÈS' : 'ÉCHEC';
  
  console.log('-'.repeat(80));
  console.log(`${color}${colors.bright}${symbol} RÉSULTAT: ${resultText}${colors.reset}${message ? ' - ' + message : ''}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Affiche une valeur de débogage avec formatage
 * @param label Étiquette pour la valeur
 * @param value Valeur à afficher
 */
export function logDebug(label: string, value: any): void {
  console.log(`${colors.cyan}${colors.bright}${symbols.debug}${colors.reset} ${label}:`);
  
  if (typeof value === 'object') {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(value);
  }
}

/**
 * Vérifie l'état de préparation pour les tests
 * @param options Options de vérification
 * @returns True si tout est prêt, false sinon
 */
export async function checkTestReadiness(options: { 
  testDatabase?: boolean, 
  testServer?: boolean, 
  testAPIs?: boolean 
} = {}): Promise<boolean> {
  logTestSection('VÉRIFICATION DE L\'ENVIRONNEMENT DE TEST', 'integration');
  
  try {
    // Vérifier la connexion à la base de données de test si demandé
    if (options.testDatabase) {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        logTest('Tentative de connexion à la base de données de test...', 'info');
        await prisma.$connect();
        logDatabase('Connexion à la base de données de test établie');
        
        // Exécuter une requête simple pour tester l'accès aux données
        const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
        if (testQuery && testQuery[0] && testQuery[0].test === 1) {
          logTest('Requête de test exécutée avec succès', 'success');
        } else {
          throw new Error('Échec de la requête de test');
        }
        
        await prisma.$disconnect();
      } catch (error) {
        logDatabase(`Erreur de connexion à la base de données: ${error.message}`, false);
        return false;
      }
    }
    
    // Vérifier le serveur de test si demandé
    if (options.testServer) {
      try {
        logTest('Vérification du serveur de test...', 'info');
        
        // Vérifier si le serveur est démarré en faisant une requête HTTP simple
        const testPort = process.env.TEST_PORT || 4001;
        const testUrl = `http://localhost:${testPort}/api/system/info`;
        
        // Implémentation d'une simple fonction fetch
        const response = await fetch(testUrl, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          logServer(`Serveur de test fonctionnel (${data.version || 'version inconnue'})`);
        } else {
          throw new Error(`Statut HTTP: ${response.status}`);
        }
      } catch (error) {
        logServer(`Serveur de test non disponible: ${error.message}`, false);
        return false;
      }
    }
    
    // Vérifier l'accès aux APIs si demandé
    if (options.testAPIs) {
      try {
        logTest('Vérification des APIs principales...', 'info');
        
        // Liste des endpoints principaux à tester
        const endpoints = [
          '/api/auth/check',
          '/api/users/status',
          '/api/roadbook/public'
        ];
        
        const serverPort = process.env.PORT || 4000;
        const baseUrl = `http://localhost:${serverPort}`;
        
        // Tester chaque endpoint
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });
            
            // Un 401 (non autorisé) est acceptable car cela signifie que l'API existe mais nécessite une authentification
            if (response.ok || response.status === 401) {
              logTest(`API ${endpoint} accessible`, 'success');
            } else {
              logTest(`API ${endpoint} a retourné ${response.status}`, 'warn');
            }
          } catch (error) {
            logTest(`API ${endpoint} non disponible: ${error.message}`, 'warn');
          }
        }
      } catch (error) {
        logTest(`Erreur lors de la vérification des APIs: ${error.message}`, 'error');
        return false;
      }
    }
    
    // Tous les tests demandés ont réussi
    logTestResult(true, 'Environnement de test prêt');
    return true;
  } catch (error) {
    logTestResult(false, error.message);
    return false;
  }
}

/**
 * Classe utilitaire pour le logging des tests
 */
export class TestLogger {
  /**
   * Log le début d'une suite de tests
   * @param suiteName Nom de la suite de tests
   * @param type Type de test
   */
  static startSuite(suiteName: string, type: TestType): void {
    const typeFormatted = this.formatTestType(type);
    console.log(`\n${colors.bright}${colors.bgBlue}${colors.white} TEST SUITE ${colors.reset}${colors.bright} ${typeFormatted} ${colors.cyan}${suiteName}${colors.reset}`);
    console.log(`${colors.dim}${"=".repeat(80)}${colors.reset}\n`);
  }

  /**
   * Log le début d'un test individuel
   * @param testName Nom du test
   */
  static startTest(testName: string): void {
    console.log(`${colors.yellow}➤ ${colors.reset}${colors.bright}${testName}${colors.reset}`);
  }

  /**
   * Log un message d'information pendant un test
   * @param message Message à logger
   */
  static info(message: string): void {
    console.log(`  ${colors.blue}${symbols.info} ${colors.reset}${message}`);
  }

  /**
   * Log un message de succès
   * @param message Message de succès
   */
  static success(message: string): void {
    console.log(`  ${colors.green}${symbols.success} ${colors.reset}${message}`);
  }

  /**
   * Log un message d'erreur
   * @param message Message d'erreur
   * @param error Objet d'erreur optionnel
   */
  static error(message: string, error?: any): void {
    console.log(`  ${colors.red}${symbols.error} ${colors.reset}${message}`);
    if (error) {
      console.error(`  ${colors.dim}${error?.message || error}${colors.reset}`);
    }
  }

  /**
   * Log un message d'avertissement
   * @param message Message d'avertissement
   */
  static warning(message: string): void {
    console.log(`  ${colors.yellow}${symbols.warn} ${colors.reset}${message}`);
  }

  /**
   * Log la fin d'une suite de tests
   * @param suiteName Nom de la suite de tests
   * @param success Si les tests ont réussi
   */
  static endSuite(suiteName: string, success: boolean): void {
    const statusText = success 
      ? `${colors.bgGreen}${colors.black} PASSED ${colors.reset}` 
      : `${colors.bgRed}${colors.white} FAILED ${colors.reset}`;
    
    console.log(`\n${colors.dim}${"=".repeat(80)}${colors.reset}`);
    console.log(`${statusText} ${colors.cyan}${suiteName}${colors.reset}\n`);
  }

  /**
   * Format un type de test pour l'affichage
   * @param type Type de test
   * @returns Type formaté
   */
  private static formatTestType(type: TestType): string {
    const typeColors = {
      [TestType.UNIT]: `${colors.bgGreen}${colors.black}`,
      [TestType.INTEGRATION]: `${colors.bgYellow}${colors.black}`,
      [TestType.E2E]: `${colors.bgMagenta}${colors.white}`,
      [TestType.CONTROLLER]: `${colors.bgCyan}${colors.black}`,
      [TestType.SERVICE]: `${colors.bgBlue}${colors.white}`,
    };

    return `${typeColors[type]} ${type} ${colors.reset}`;
  }
}

// Exporter la classe directement 
export default TestLogger;