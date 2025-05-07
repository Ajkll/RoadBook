import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { logger } from './logger';

// Check if we're running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Définir le comportement global des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Enregistrement pour les notifications push
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // If we're in Expo Go and on a device (not simulator), show warning
  if (isExpoGo && Device.isDevice && Platform.OS !== 'web') {
    console.warn(
      'Push notifications are not available in Expo Go as of SDK 53. ' +
      'Use a development build instead.'
    );
    return undefined;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permission de notifications refusée.');
      return;
    }

    // Only try to get push token if not in Expo Go
    if (!isExpoGo) {
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) throw new Error('Project ID introuvable');

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log('Token Expo Push:', token);
      } catch (error) {
        logger.error('Erreur lors de l\'obtention du token:', error);
        return;
      }
    }
  } else {
    console.warn('Les notifications push nécessitent un appareil physique.');
  }

  return token;
}

// Planifier une notification locale (fonctionnera dans Expo Go)
export async function scheduleLocalNotification(title: string, body: string, seconds: number = 5) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: { seconds },
  });
}

// Planifier une notification motivationnelle
export async function scheduleMotivationalNotification(kmRemaining: number, frequency: 'daily' | 'weekly') {
  // Si nous sommes dans Expo Go, utiliser une notification locale immédiate à la place des push
  if (isExpoGo && Device.isDevice) {
    const title = "Objectif en vue ! 🚗";
    const body = `Il vous reste ${kmRemaining} km à parcourir. Vous pouvez le faire !`;

    // Simuler avec une notification locale retardée de quelques secondes
    return scheduleLocalNotification(title, body, 5);
  }

  // Pour les versions de développement réelles, implémenter la logique de push notifications
  // Cette partie du code ne s'exécutera pas dans Expo Go
  const title = "Objectif en vue ! 🚗";
  const body = `Il vous reste ${kmRemaining} km à parcourir. Vous pouvez le faire !`;

  try {
    // Choisir l'intervalle selon la fréquence
    const seconds = frequency === 'daily' ? 86400 : 604800; // 24h ou 7 jours

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { kmRemaining },
      },
      trigger: {
        seconds,
        repeats: true
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la planification de la notification:', error);
    return null;
  }
}