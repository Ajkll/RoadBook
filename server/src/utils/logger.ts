/**
 * LOGGER UTILITY
 * 
 * Ce module fournit un logger configuré pour l'application.
 * Il utilise Winston pour:
 * - Logger dans la console avec couleurs en développement
 * - Logger dans des fichiers en production
 * - Différents niveaux de log (error, warn, info, debug)
 * - Format timestamp pour faciliter le debugging
 * 
 * En production, seuls les logs de niveau info et supérieur sont affichés en console.
 * En développement, tous les logs (y compris debug) sont affichés.
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

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
const logger = winston.createLogger({
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
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      // Ne pas afficher les logs si les tests sont en cours avec --silent
      silent: process.argv.includes('--silent')
    })
  );
}

/**
 * Fonctions de log avec support pour les objets (auto-stringify)
 */
export default {
  error: (message: string, ...meta: any[]) => {
    const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
    logger.error(`${message}${metaString}`);
  },
  
  warn: (message: string, ...meta: any[]) => {
    const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
    logger.warn(`${message}${metaString}`);
  },
  
  info: (message: string, ...meta: any[]) => {
    const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
    logger.info(`${message}${metaString}`);
  },
  
  http: (message: string, ...meta: any[]) => {
    const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
    logger.http(`${message}${metaString}`);
  },
  
  debug: (message: string, ...meta: any[]) => {
    const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
    logger.debug(`${message}${metaString}`);
  }
};