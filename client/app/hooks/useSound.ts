import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Audio } from 'expo-av';
import { SoundKey, SOUNDS, SoundConfig } from '../constants/sound';
import { RootState } from '../store/store';
import { setGlobalMute, setGlobalVolume, updateSoundConfig } from '../store/slices/appSoundSlice';
import { playSound } from '../utils/soundPlayer';
import { logger } from '../utils/logger';

export const useSound = () => {
  const dispatch = useDispatch();
  const { globalVolume, globalMute, sounds } = useSelector((state: RootState) => state.sound);

  const setVolume = (volume: number) => {
    dispatch(setGlobalVolume(volume));
  };

  const setMute = (mute: boolean) => {
    dispatch(setGlobalMute(mute));
  };

  const updateConfig = (key: SoundKey, config: Partial<SoundConfig>) => {
    dispatch(updateSoundConfig({ key, config }));
  };

  const getSoundConfig = (key: SoundKey): SoundConfig | undefined => {
    return sounds[key];
  };

  const play = async (key: SoundKey) => {
    if (globalMute) return;

    const soundConfig = sounds[key];
    if (!soundConfig || soundConfig.isMuted) return;

    await playSound(
      key,
      soundConfig.volume * globalVolume,
      soundConfig.isAbsolutePriority,
      soundConfig.isSuperposable,
      soundConfig.canInterrupt
    );
  };

  // prechargement des sons
  useEffect(() => {
    const preloadSounds = async () => {
      try {
        const soundKeys = Object.keys(SOUNDS) as SoundKey[];
        
        // Charger les sons courts avec un délai pour éviter les surcharges
        for (const key of soundKeys) {
          if (SOUNDS[key].isShortSound) {
            try {
              if (!SOUNDS[key].soundObject) {
                // Vérifier si le son n'est pas déjà chargé
                console.log(`Preloading short sound ${key}...`);
                
                // Utiliser try/catch pour chaque son
                try {
                  const { sound } = await Audio.Sound.createAsync(
                    SOUNDS[key].asset,
                    { shouldPlay: false }
                  );
                  
                  // Sauvegarder la référence
                  SOUNDS[key].soundObject = sound;
                  
                  // Délai entre chaque chargement
                  await new Promise((resolve) => setTimeout(resolve, 200));
                } catch (soundError) {
                  console.warn(`Could not preload sound ${key}:`, soundError.message);
                }
              }
            } catch (error) {
              // Error silencieuse - continuer avec les autres sons
            }
          }
        }
      } catch (error) {
        logger.error('Audio initialization error:', error);
      }
    };

    // Démarrer le préchargement après un court délai
    const timer = setTimeout(() => {
      preloadSounds();
    }, 1000);

    return () => {
      clearTimeout(timer);
      
      // Décharger proprement les sons
      try {
        const soundKeys = Object.keys(SOUNDS) as SoundKey[];
        soundKeys.forEach((key) => {
          if (SOUNDS[key].soundObject) {
            try {
              SOUNDS[key].soundObject?.unloadAsync().catch(() => {
                // Ignorer les erreurs silencieusement pendant le nettoyage
                SOUNDS[key].soundObject = undefined;
              });
            } catch (e) {
              // Ignorer les erreurs de déchargement
            }
          }
        });
      } catch (e) {
        // Ignorer les erreurs globales pendant le nettoyage
      }
    };
  }, []);

  return {
    play,
    setVolume,
    setMute,
    updateConfig,
    globalVolume,
    globalMute,
    getSoundConfig,
  };
};
