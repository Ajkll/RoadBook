"use strict";
/**
 * VERCEL LOGGER UTILITY
 *
 * Logger simplifié spécifiquement pour l'environnement Vercel serverless.
 * Utilise uniquement la console, sans dépendance au système de fichiers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Niveaux de logging
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["HTTP"] = 3] = "HTTP";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
})(LogLevel || (LogLevel = {}));
// Couleurs pour la console (utilisées uniquement pour le formatage)
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
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
// Formatage du timestamp
const getTimestamp = () => {
    return new Date().toISOString();
};
// Fonctions de log
exports.default = {
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
