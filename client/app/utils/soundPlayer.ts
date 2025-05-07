import { Audio } from 'expo-av';
import { SOUNDS, SoundKey } from '../constants/sound';
import { logger } from './logger';

let soundCache: Record<SoundKey, Audio.Sound | null> = {} as Record<SoundKey, Audio.Sound | null>;
let currentlyPlaying: SoundKey[] = [];

const loadSound = async (key: SoundKey) => {
  if (soundCache[key]) return soundCache[key];

  try {
    console.log(`Loading sound: ${key}`);
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

    soundCache[key] = sound;
    return sound;
  } catch (error) {
    logger.error(`Error loading sound ${key}:`, error);
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
    await Promise.all(
      currentlyPlaying.map(async (key) => {
        const sound = soundCache[key];
        if (sound) {
          await sound.stopAsync();
        }
      })
    );
    currentlyPlaying = [];
  } catch (error) {
    logger.error('Error stopping sounds:', error);
  }
};

export const unloadAllSounds = async () => {
  try {
    await Promise.all(
      Object.keys(soundCache).map(async (key) => {
        const sound = soundCache[key as SoundKey];
        if (sound) {
          await sound.unloadAsync();
        }
      })
    );
    soundCache = {} as Record<SoundKey, Audio.Sound | null>;
  } catch (error) {
    logger.error('Error unloading sounds:', error);
  }
};
