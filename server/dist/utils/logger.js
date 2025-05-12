"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Créer le répertoire de logs s'il n'existe pas
const logDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
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
winston_1.default.addColors(colors);
// Format pour la console
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`));
// Format pour les fichiers (sans couleurs, mais avec plus de détails)
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.json());
// Détecter l'environnement
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
// Créer le logger
const logger = winston_1.default.createLogger({
    level: isTest ? 'error' : isProd ? 'info' : 'debug',
    levels,
    format: fileFormat,
    transports: [
        // Logger les erreurs dans un fichier séparé
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error'
        }),
        // Logger tous les messages dans un fichier
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'combined.log')
        }),
    ],
    // Ne pas quitter en cas d'erreur non gérée
    exitOnError: false
});
// En développement ou test, logger aussi dans la console
if (!isProd || isTest) {
    logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
        // Ne pas afficher les logs si les tests sont en cours avec --silent
        silent: process.argv.includes('--silent')
    }));
}
/**
 * Fonctions de log avec support pour les objets (auto-stringify)
 */
exports.default = {
    error: (message, ...meta) => {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        logger.error(`${message}${metaString}`);
    },
    warn: (message, ...meta) => {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        logger.warn(`${message}${metaString}`);
    },
    info: (message, ...meta) => {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        logger.info(`${message}${metaString}`);
    },
    http: (message, ...meta) => {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        logger.http(`${message}${metaString}`);
    },
    debug: (message, ...meta) => {
        const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        logger.debug(`${message}${metaString}`);
    }
};
