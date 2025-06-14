/**
 * LOGGER UTILITY
 * 
 * Ce module sélectionne le logger approprié selon l'environnement:
 * - Version simplifiée pour Vercel/serverless
 * - Logger complet avec Winston pour les autres environnements
 * 
 * Cette approche permet d'éviter les erreurs liées aux systèmes de fichiers
 * dans les environnements serverless.
 */

// Imports au niveau module (obligatoire en TypeScript)
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Detect Vercel environment
const isVercel = process.env.VERCEL === '1';

// Niveaux de logging
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
}

// Formatage du timestamp
const getTimestamp = (): string => {
  return new Date().toISOString();
};

// Niveau de log basé sur l'environnement
const getLogLevel = (): LogLevel => {
  if (process.env.NODE_ENV === 'test') return LogLevel.ERROR;
  if (process.env.NODE_ENV === 'production') return LogLevel.INFO;
  return LogLevel.DEBUG;
};

// Niveau de log actuel
const currentLogLevel = getLogLevel();

// Création du logger approprié selon l'environnement
let loggerInstance: any;

if (isVercel) {
  // Simple console-based logger for Vercel
  loggerInstance = {
    error: (message: string, ...meta: any[]): void => {
      if (currentLogLevel >= LogLevel.ERROR) {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        console.error(`${getTimestamp()} [ERROR]: ${message}${metaString}`);
      }
    },

    warn: (message: string, ...meta: any[]): void => {
      if (currentLogLevel >= LogLevel.WARN) {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        console.warn(`${getTimestamp()} [WARN]: ${message}${metaString}`);
      }
    },

    info: (message: string, ...meta: any[]): void => {
      if (currentLogLevel >= LogLevel.INFO) {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        console.info(`${getTimestamp()} [INFO]: ${message}${metaString}`);
      }
    },

    http: (message: string, ...meta: any[]): void => {
      if (currentLogLevel >= LogLevel.HTTP) {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        console.log(`${getTimestamp()} [HTTP]: ${message}${metaString}`);
      }
    },

    debug: (message: string, ...meta: any[]): void => {
      if (currentLogLevel >= LogLevel.DEBUG) {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        console.debug(`${getTimestamp()} [DEBUG]: ${message}${metaString}`);
      }
    }
  };
} else {
  // Pour les environnements non-serverless, utiliser Winston avec système de fichiers
  
  // Créer le répertoire de logs s'il n'existe pas
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Définir les niveaux et couleurs
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };

  const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  };

  // Ajouter les couleurs à Winston
  winston.addColors(colors);

  // Format pour la console
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info) => `${info.timestamp} [${info.level}]: ${info.message}`
    )
  );

  // Format pour les fichiers (sans couleurs, mais avec plus de détails)
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  );

  // Détecter l'environnement
  const isProd = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  // Créer le logger
  const winstonLogger = winston.createLogger({
    level: isTest ? 'error' : isProd ? 'info' : 'debug',
    levels,
    format: fileFormat,
    transports: [
      // Logger les erreurs dans un fichier séparé
      new winston.transports.File({ 
        filename: path.join(logDir, 'error.log'), 
        level: 'error' 
      }),
      
      // Logger tous les messages dans un fichier
      new winston.transports.File({ 
        filename: path.join(logDir, 'combined.log')
      }),
    ],
    // Ne pas quitter en cas d'erreur non gérée
    exitOnError: false
  });

  // En développement ou test, logger aussi dans la console
  if (!isProd || isTest) {
    winstonLogger.add(
      new winston.transports.Console({
        format: consoleFormat,
        // Ne pas afficher les logs si les tests sont en cours avec --silent
        silent: process.argv.includes('--silent')
      })
    );
  }

  // Wrapper pour uniformiser l'interface
  loggerInstance = {
    error: (message: string, ...meta: any[]) => {
      const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
      winstonLogger.error(`${message}${metaString}`);
    },
    
    warn: (message: string, ...meta: any[]) => {
      const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
      winstonLogger.warn(`${message}${metaString}`);
    },
    
    info: (message: string, ...meta: any[]) => {
      const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
      winstonLogger.info(`${message}${metaString}`);
    },
    
    http: (message: string, ...meta: any[]) => {
      const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
      winstonLogger.http(`${message}${metaString}`);
    },
    
    debug: (message: string, ...meta: any[]) => {
      const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
      winstonLogger.debug(`${message}${metaString}`);
    }
  };
}

// Exporter le logger sélectionné
const logger = loggerInstance;
export default logger;
// Export nommé pour la compatibilité avec les imports existants
export { logger };