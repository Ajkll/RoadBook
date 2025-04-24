import Toast from 'react-native-toast-message';
import { Audio } from 'expo-av';
import { useSound } from '../../hooks/useSound';
import { SOUNDS } from '../../constants/sound';

// Version simple (sans hook)
export const showNotification = (
  type: 'success' | 'error' | 'warning' | 'info',
  text1: string,
  text2?: string,
  options?: {
    position?: 'top' | 'center' | 'bottom';
    soundEnabled?: boolean;
    visibilityTime?: number; // Ajout cohérent avec la version hook
  }
) => {
  // Afficher le Toast
  Toast.show({
    type,
    text1,
    text2,
    position: options?.position || 'top',
    visibilityTime: options?.visibilityTime || (type === 'error' ? 5000 : 3000), // Même logique que la version hook
  });

  // Jouer le son correspondant si activé
  if (options?.soundEnabled !== false) {
    let soundKey: keyof typeof SOUNDS;
    switch (type) {
      case 'success':
        soundKey = 'SUCCESS_SOUND';
        break;
      case 'error':
        soundKey = 'ERROR_SOUND';
        break;
      case 'warning':
        soundKey = 'WARNING_SOUND';
        break;
      case 'info':
      default:
        soundKey = 'NOTIFICATION';
        break;
    }

    // Utilisation directe du player (version simplifiée)
    const playSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(SOUNDS[soundKey].asset, {
          shouldPlay: true,
          volume: SOUNDS[soundKey].defaultConfig.volume,
        });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    };

    playSound();
  }
};

// Version avec hook (pour les composants React)
export const useNotification = () => {
  const { play } = useSound();

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    text1: string,
    text2?: string,
    options?: {
      position?: 'top' | 'center' | 'bottom';
      soundEnabled?: boolean;
      visibilityTime?: number;
    }
  ) => {
    Toast.show({
      type,
      text1,
      text2,
      position: options?.position || 'top',
      visibilityTime: options?.visibilityTime || (type === 'error' ? 5000 : 3000),
    });

    if (options?.soundEnabled !== false) {
      let soundKey: keyof typeof SOUNDS;
      switch (type) {
        case 'success':
          soundKey = 'SUCCESS_SOUND';
          break;
        case 'error':
          soundKey = 'ERROR_SOUND';
          break;
        case 'warning':
          soundKey = 'WARNING_SOUND';
          break;
        case 'info':
        default:
          soundKey = 'NOTIFICATION';
          break;
      }

      play(soundKey);
    }
  };

  return { showNotification };
};
