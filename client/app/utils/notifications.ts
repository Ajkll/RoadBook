import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
      console.error('Erreur lors de l’obtention du token:', error);
      return;
    }
  } else {
    console.warn('Les notifications push nécessitent un appareil physique.');
  }

  return token;
}

// Planifier une notification d'encouragement sans utiliser trigger complet
/*
export async function scheduleMotivationalNotification(kmRemaining: number, frequency: 'daily' | 'weekly') {
  const title = "Objectif en vue ! 🚗";
  const body = `Il vous reste ${kmRemaining} km à parcourir. Vous pouvez le faire !`;

  const delay = frequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 24h pour daily, 7 jours pour weekly

  // Planification via setTimeout pour gérer les notifications
  setTimeout(async () => {
    try {
      // Planification immédiate de la notification avec trigger minimal
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: { kmRemaining },
        },
        trigger: { seconds: 0 }, // Déclenchement immédiat
      });
    } catch (error) {
      console.error('Erreur lors de la planification de la notification:', error);
    }
  }, delay); // Déclenchement après le délai spécifié
}
*/
