import { Audio } from 'expo-av';
import { SOUNDS, SoundKey } from '../constants/sound';
import { logger } from './logger';

// Utiliser un Map pour une meilleure gestion de la mémoire et des références
const soundCache = new Map<SoundKey, Audio.Sound | null>();
let currentlyPlaying: SoundKey[] = [];

const loadSound = async (key: SoundKey) => {
  // Vérifier si le son est déjà en cache et valide
  if (soundCache.has(key) && soundCache.get(key)) {
    const sound = soundCache.get(key);
    try {
      // Vérifier si le son est toujours valide
      const status = await sound?.getStatusAsync();
      if (status?.isLoaded) {
        return sound;
      }
    } catch (e) {
      // Le son n'est pas valide, on va le recharger
    }
  }

  try {
    // Charger un nouveau son
    const { sound } = await Audio.Sound.createAsync(
      SOUNDS[key].asset,
      { shouldPlay: false },
      (status) => {
        if (!status.isLoaded) {
          if (status.error) {
            logger.error(`Playback error for ${key}:`, status.error);
          }
        }
      }
    );

    soundCache.set(key, sound);
    return sound;
  } catch (error) {
    logger.error(`Error loading sound ${key}:`, error);
    soundCache.set(key, null);
    return null;
  }
};

export const playSound = async (
  key: SoundKey,
  volume: number,
  isAbsolutePriority: boolean,
  isSuperposable: boolean,
  canInterrupt: boolean
) => {
  try {
    if (volume <= 0) return;

    if (SOUNDS[key].isShortSound) {
      return await playShortSound(key, volume);
    }

    const sound = await loadSound(key);
    if (!sound) return;

    if (isAbsolutePriority) {
      await stopAllSounds();
    } else if (!isSuperposable && currentlyPlaying.length > 0) {
      return;
    }

    if (canInterrupt && currentlyPlaying.length > 0) {
      await stopAllSounds();
    }

    await sound.setVolumeAsync(volume);
    await sound.replayAsync();

    currentlyPlaying = currentlyPlaying.filter((k) => k !== key);
    currentlyPlaying.push(key);
  } catch (error) {
    logger.error(`Error playing sound ${key}:`, error);
  }
};

const playShortSound = async (key: SoundKey, volume: number) => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      SOUNDS[key].asset,
      { shouldPlay: true, volume },
      undefined,
      true
    );

    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        await sound.unloadAsync();
      }
    });
  } catch (error) {
    logger.error(`Error playing short sound ${key}:`, error);
  }
};

export const stopAllSounds = async () => {
  try {
    for (const key of [...currentlyPlaying]) {
      const sound = soundCache.get(key);
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.stopAsync();
          }
        } catch (soundError) {
          // Ignorer les erreurs si le son n'existe plus
          soundCache.set(key, null);
        }
      }
    }
    currentlyPlaying = [];
  } catch (error) {
    logger.error('Error stopping sounds:', error);
  }
};

export const unloadAllSounds = async () => {
  try {
    // Utiliser une approche séquentielle plus sûre pour éviter les erreurs
    for (const key of soundCache.keys()) {
      const sound = soundCache.get(key);
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.unloadAsync();
          }
        } catch (soundError) {
          // Ignorer silencieusement les erreurs individuelles
        }
      }
    }
    soundCache.clear();
    currentlyPlaying = [];
  } catch (error) {
    logger.error('Error unloading sounds:', error);
  }
};
