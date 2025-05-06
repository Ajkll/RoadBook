import Constants from 'expo-constants';
import { Platform } from 'react-native';
import loglevel from 'loglevel';

// Définir le niveau de log en fonction de l'environnement
const logLevel = __DEV__ ? 'debug' : 'error';

// Variables pour Sentry
let isSentryInitialized = false;
let SentryExpo: any = null;

// Fonction pour initialiser le logger
export async function initLogger() {
  // Configuration de loglevel pour la journalisation de base
  loglevel.setLevel(logLevel);
  console.log(`Base logger initialized with level: ${logLevel}`);

  // Désactiver Sentry dans Expo Go en développement
  if (__DEV__ && Constants.appOwnership === 'expo') {
    console.warn('Sentry is disabled in Expo Go development mode');
    return;
  }

  try {
    // Import dynamique de Sentry
    try {
      const SentryModule = await import('sentry-expo');
      // Correction importante pour l'import
      SentryExpo = SentryModule.default || SentryModule;
      console.log('Sentry module imported successfully');
    } catch (importError) {
      console.error('Failed to import sentry-expo:', importError);
      return;
    }

    // Récupération du DSN depuis les constantes d'Expo
    const dsn = Constants.expoConfig?.extra?.SENTRY_DSN;

    if (!dsn) {
      console.warn('No Sentry DSN provided in app config, skipping Sentry initialization');
      return;
    }

    console.log(`Initializing Sentry with DSN: ${dsn.substring(0, 20)}...`);

    // Initialisation de Sentry
    try {
      if (!SentryExpo.init) {
        throw new Error('Sentry.init is not available - check sentry-expo version');
      }

      SentryExpo.init({
        dsn,
        enableInExpoDevelopment: true,
        debug: __DEV__,
        environment: __DEV__ ? 'development' : 'production',
        beforeSend: (event) => {
          if (__DEV__) {
            console.log('Sending event to Sentry:', event.event_id);
          }
          return event;
        },
      });

      console.log('Sentry.init() completed');
    } catch (initError) {
      console.error('Failed to initialize Sentry:', initError);
      return;
    }

    // Configuration des tags de base
    try {
      if (SentryExpo.Native) {
        SentryExpo.Native.setTag('app.version', Constants.expoConfig?.version || 'unknown');
        SentryExpo.Native.setTag('platform', Platform.OS);
        SentryExpo.Native.setTag('environment', __DEV__ ? 'development' : 'production');
        console.log('Sentry tags set successfully');
      }
    } catch (tagError) {
      console.warn('Error setting Sentry tags:', tagError);
    }

    // Test d'envoi d'un événement simple
    try {
      console.log('Sending test event to Sentry...');
      SentryExpo.captureMessage('Logger initialized - test message', 'info');
      console.log('Test event sent to Sentry');
    } catch (testError) {
      console.error('Failed to send test event to Sentry:', testError);
    }

    // Marquer Sentry comme initialisé
    isSentryInitialized = true;
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry (global error):', error);
  }
}

// Fonctions sécurisées pour Sentry
const safeCapture = {
  message: (message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info') => {
    if (!isSentryInitialized || !SentryExpo) {
      if (__DEV__) {
        console.warn(`Sentry not initialized, can't send message: ${message}`);
      }
      return;
    }

    try {
      if (__DEV__) {
        console.log(`Sending message to Sentry: ${message} (${level})`);
      }
      SentryExpo.captureMessage(message, { level });
    } catch (e) {
      console.warn('Error capturing Sentry message:', e);
    }
  },

  exception: (error: Error) => {
    if (!isSentryInitialized || !SentryExpo) {
      if (__DEV__) {
        console.warn(`Sentry not initialized, can't send exception: ${error.message}`);
      }
      return;
    }

    try {
      if (__DEV__) {
        console.log(`Sending exception to Sentry: ${error.message}`);
      }
      SentryExpo.captureException(error);
    } catch (e) {
      console.warn('Error capturing Sentry exception:', e);
    }
  }
};

// Interface du logger
export const logger = {
  debug: (message: string) => {
    loglevel.debug(`[DEBUG] ${message}`);
    if (__DEV__) {
      safeCapture.message(`[DEBUG] ${message}`, 'debug');
    }
  },

  info: (message: string) => {
    loglevel.info(`[INFO] ${message}`);
    safeCapture.message(`[INFO] ${message}`, 'info');
  },

  warn: (message: string) => {
    loglevel.warn(`[WARN] ${message}`);
    safeCapture.message(`[WARN] ${message}`, 'warning');
  },

  error: (message: string, error?: Error) => {
    loglevel.error(`[ERROR] ${message}`, error || '');

    if (error instanceof Error) {
      if (__DEV__) {
        console.error(`Error object details:`, {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      safeCapture.exception(error);
    } else {
      safeCapture.message(`[ERROR] ${message}`, 'error');
    }
  },

  setUser: (userData: { id?: string; email?: string; username?: string }) => {
    if (isSentryInitialized && SentryExpo) {
      try {
        SentryExpo.setUser(userData);
        if (__DEV__) {
          console.log(`Sentry user set: ${JSON.stringify(userData)}`);
        }
      } catch (e) {
        console.warn('Error setting Sentry user:', e);
      }
    } else if (__DEV__) {
      console.warn(`Sentry not initialized, can't set user: ${JSON.stringify(userData)}`);
    }
  },

  addBreadcrumb: (breadcrumb: {
    category?: string;
    message: string;
    data?: Record<string, any>;
  }) => {
    if (isSentryInitialized && SentryExpo) {
      try {
        SentryExpo.addBreadcrumb({
          category: breadcrumb.category || 'app',
          message: breadcrumb.message,
          data: breadcrumb.data,
          level: 'info',
        });
      } catch (e) {
        console.warn('Error adding Sentry breadcrumb:', e);
      }
    } else if (__DEV__) {
      console.warn(`Sentry not initialized, can't add breadcrumb: ${breadcrumb.message}`);
    }
  },

  isSentryReady: () => {
    return isSentryInitialized;
  },

  // Nouvelle méthode pour le debug
  debugSentryStatus: () => {
    return {
      isInitialized: isSentryInitialized,
      hasModule: !!SentryExpo,
      dsnConfigured: !!Constants.expoConfig?.extra?.SENTRY_DSN,
      environment: __DEV__ ? 'development' : 'production',
      appOwnership: Constants.appOwnership
    };
  }
};