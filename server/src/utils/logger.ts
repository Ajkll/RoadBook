/**
 * LOGGER UTILITY
 * 
 * Ce module fournit un logger configuré pour l'application.
 * Il utilise Winston pour:
 * - Logger dans la console avec couleurs en développement
 * - Différents niveaux de log (error, warn, info, debug)
 * - Format timestamp pour faciliter le debugging
 * 
 * Version compatible Vercel/Serverless: Logs uniquement dans la console
 */

import winston from 'winston';

// Détection de l'environnement serverless
const isServerless = !!process.env.VERCEL;

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

// Détecter l'environnement
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Configurer les transports basés sur l'environnement
const transports: winston.transport[] = [
  // Toujours inclure la console
  new winston.transports.Console({
    format: consoleFormat,
    silent: process.argv.includes('--silent')
  })
];

// Créer le logger
const logger = winston.createLogger({
  level: isTest ? 'error' : isProd ? 'info' : 'debug',
  levels,
  format: consoleFormat,
  transports,
  exitOnError: false
});

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