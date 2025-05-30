"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// Imports au niveau module (obligatoire en TypeScript)
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Detect Vercel environment
const isVercel = process.env.VERCEL === '1';
// Niveaux de logging
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["HTTP"] = 3] = "HTTP";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
})(LogLevel || (LogLevel = {}));
// Formatage du timestamp
const getTimestamp = () => {
    return new Date().toISOString();
};
// Niveau de log basé sur l'environnement
const getLogLevel = () => {
    if (process.env.NODE_ENV === 'test')
        return LogLevel.ERROR;
    if (process.env.NODE_ENV === 'production')
        return LogLevel.INFO;
    return LogLevel.DEBUG;
};
// Niveau de log actuel
const currentLogLevel = getLogLevel();
// Création du logger approprié selon l'environnement
let loggerInstance;
if (isVercel) {
    // Simple console-based logger for Vercel
    loggerInstance = {
        error: (message, ...meta) => {
            if (currentLogLevel >= LogLevel.ERROR) {
                const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
                console.error(`${getTimestamp()} [ERROR]: ${message}${metaString}`);
            }
        },
        warn: (message, ...meta) => {
            if (currentLogLevel >= LogLevel.WARN) {
                const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
                console.warn(`${getTimestamp()} [WARN]: ${message}${metaString}`);
            }
        },
        info: (message, ...meta) => {
            if (currentLogLevel >= LogLevel.INFO) {
                const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
                console.info(`${getTimestamp()} [INFO]: ${message}${metaString}`);
            }
        },
        http: (message, ...meta) => {
            if (currentLogLevel >= LogLevel.HTTP) {
                const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
                console.log(`${getTimestamp()} [HTTP]: ${message}${metaString}`);
            }
        },
        debug: (message, ...meta) => {
            if (currentLogLevel >= LogLevel.DEBUG) {
                const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
                console.debug(`${getTimestamp()} [DEBUG]: ${message}${metaString}`);
            }
        }
    };
}
else {
    // Pour les environnements non-serverless, utiliser Winston avec système de fichiers
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
    const winstonLogger = winston_1.default.createLogger({
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
        winstonLogger.add(new winston_1.default.transports.Console({
            format: consoleFormat,
            // Ne pas afficher les logs si les tests sont en cours avec --silent
            silent: process.argv.includes('--silent')
        }));
    }
    // Wrapper pour uniformiser l'interface
    loggerInstance = {
        error: (message, ...meta) => {
            const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
            winstonLogger.error(`${message}${metaString}`);
        },
        warn: (message, ...meta) => {
            const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
            winstonLogger.warn(`${message}${metaString}`);
        },
        info: (message, ...meta) => {
            const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
            winstonLogger.info(`${message}${metaString}`);
        },
        http: (message, ...meta) => {
            const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
            winstonLogger.http(`${message}${metaString}`);
        },
        debug: (message, ...meta) => {
            const metaString = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
            winstonLogger.debug(`${message}${metaString}`);
        }
    };
}
// Exporter le logger sélectionné
const logger = loggerInstance;
exports.logger = logger;
exports.default = logger;
