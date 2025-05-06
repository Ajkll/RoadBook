// app/utils/logger.ts
import log from 'loglevel';
import { FileLogger } from 'react-native-file-logger';

type LogEntry = {
  id: string;
  level: string;
  message: string;
  timestamp: Date;
};

// Stockage des logs en mémoire pour l'UI
let uiLogs: LogEntry[] = [];

// Configuration initiale
log.setDefaultLevel(__DEV__ ? log.levels.DEBUG : log.levels.INFO);

// Configuration du transport fichier (seulement en prod)
if (!__DEV__) {
  FileLogger.configure({
    dailyRolling: true,
    maximumFileSize: 1024 * 1024,
    maximumNumberOfFiles: 3,
    logsDirectory: 'roadbook_logs',
  });
}

// Fonction d'interception générique
const createInterceptedLogger = (originalMethod: log.LoggingMethod, level: string) => {
  return (message: string, ...args: any[]) => {
    // Stocke pour l'UI
    uiLogs.push({
      id: Math.random().toString(),
      level: level.toUpperCase(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
      timestamp: new Date()
    });

    // Limite la taille du tableau
    if (uiLogs.length > 1000) uiLogs = uiLogs.slice(-500);

    // Log original
    originalMethod(message, ...args);

    // Log dans fichier en prod
    if (__DEV__) {
      FileLogger.write(level.toUpperCase(), message);
    }
  };
};

// Crée les méthodes interceptées
const interceptedLogger = {
  debug: createInterceptedLogger(log.debug, 'debug'),
  info: createInterceptedLogger(log.info, 'info'),
  warn: createInterceptedLogger(log.warn, 'warn'),
  error: createInterceptedLogger(log.error, 'error'),
  getLogger: log.getLogger,
  getLogs: (filter: string = 'ALL') => filter === 'ALL' ? uiLogs : uiLogs.filter(log => log.level === filter.toUpperCase()),
  clearLogs: () => { uiLogs = []; },
  setLevel: log.setLevel,
  enableAll: log.enableAll,
  disableAll: log.disableAll
};

// Exporte le logger enrichi
export const logger = interceptedLogger;
export const apiLogger = interceptedLogger.getLogger('API');
export const authLogger = interceptedLogger.getLogger('Auth');
export const syncLogger = interceptedLogger.getLogger('Sync');


console.log = (...args) => logger.debug(...args);
console.info = (...args) => logger.info(...args);
console.warn = (...args) => logger.warn(...args);
console.error = (...args) => logger.error(...args);


// Initialisation unique
export const initLogger = () => {
  logger.info('Logger initialized');
};