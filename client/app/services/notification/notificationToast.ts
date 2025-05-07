import Toast from 'react-native-toast-message';
import { Audio } from 'expo-av';
import { useSound } from '../../hooks/useSound';
import { SOUNDS } from '../../constants/sound';
import { logger } from '../../utils/logger';

// Version simple (sans hook)
export const showNotification = (
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
    visibilityTime: options?.visibilityTime || (type === 'error' ? 5000 : 3000), // Même logique que la version hook
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
        logger.error('Error playing notification sound:', error);
      }
    };

    playSound();
  }
};

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
