import * as SentryModule from 'sentry-expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import loglevel from 'loglevel';

// Dans sentry-expo v7.x, on utilise directement SentryModule pour init
const Sentry = SentryModule.Native;
const logLevel = __DEV__ ? 'debug' : 'error';
const enableDevLoggingForTesting = false;
let isSentryInitialized = false;

export async function initLogger() {
  loglevel.setLevel(logLevel);
  console.log(`Base logger initialized with level: ${logLevel}`);
  if (__DEV__ && !enableDevLoggingForTesting) {
    console.warn('Sentry is disabled in Expo Go development mode');
    return;
  }

  try {
    const dsn = Constants.expoConfig?.extra?.SENTRY_DSN;

    if (!dsn) {
      console.warn('No Sentry DSN provided in app config, skipping Sentry initialization');
      return;
    }
    console.log(`Initializing Sentry with DSN: ${dsn.substring(0, 20)}...`);
    try {
      await SentryModule.init({
        dsn,
        debug: __DEV__,
        enableInExpoDevelopment: true,
        environment: __DEV__ ? 'development' : 'production',

        // a reactive en mode prod
        enableNativeNagger: false,
        enableNativeCrashHandling: false,
        enableNativeTracking: false,

        // a reactive en mode prod
        enableAutoSessionTracking: false,
        enableAutoPerformanceTracking: false,
        enableOutOfMemoryTracking: false,
        attachStacktrace: false,

        beforeSend: (event) => {
          if (__DEV__) {
            console.log('Sending event to Sentry:', event.event_id);
          }
          // Enlever les données de stack pour éviter la symbolication on peut la reactiver en mode prod
          if (event && event.exception && event.exception.values) {
            event.exception.values.forEach(ex => {
              if (ex.stacktrace) {
                delete ex.stacktrace;
              }
            });
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
      Sentry.setTag('app.version', Constants.expoConfig?.version || 'unknown');
      Sentry.setTag('platform', Platform.OS);
      Sentry.setTag('environment', __DEV__ ? 'development' : 'production');
      console.log('Sentry tags set successfully');
    } catch (tagError) {
      console.warn('Error setting Sentry tags:', tagError);
    }

    try {
      console.log('Sending test event to Sentry...');
      Sentry.captureMessage('Logger initialized - test message');
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

const safeCapture = {
  message: (message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info') => {
    if (!isSentryInitialized) {
      if (__DEV__) {
        console.warn(`Sentry not initialized, can't send message: ${message}`);
      }
      return;
    }
    try {
      if (__DEV__) {
        console.log(`Sending message to Sentry: ${message} (${level})`);
      }

      Sentry.captureMessage(message);
    } catch (e) {
      console.warn('Error capturing Sentry message:', e);
    }
  },

  exception: (error: Error) => {
    if (!isSentryInitialized) {
      if (__DEV__) {
        console.warn(`Sentry not initialized, can't send exception: ${error.message}`);
      }
      return;
    }
    try {
      if (__DEV__) {
        console.log(`Sending exception to Sentry: ${error.message}`);
      }
      Sentry.captureMessage(`[EXCEPTION] ${error.name}: ${error.message}`);
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
    if (isSentryInitialized) {
      try {
        Sentry.setUser(userData);
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
    if (isSentryInitialized) {
      try {
        Sentry.addBreadcrumb({
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

  // Méthode pour le debug
  debugSentryStatus: () => {
    return {
      isInitialized: isSentryInitialized,
      hasModule: !!Sentry,
      dsnConfigured: !!Constants.expoConfig?.extra?.SENTRY_DSN,
      environment: __DEV__ ? 'development' : 'production',
      appOwnership: Constants.appOwnership
    };
  }
};