import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Audio } from 'expo-av';
import { SoundKey, SOUNDS, SoundConfig } from '../constants/sound';
import { RootState } from '../store/store';
import { setGlobalMute, setGlobalVolume, updateSoundConfig } from '../store/slices/appSoundSlice';
import { playSound } from '../utils/soundPlayer';

export const useSound = () => {
  const dispatch = useDispatch();
  const { globalVolume, globalMute, sounds } = useSelector(
    (state: RootState) => state.sound
  );

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

  // Préchargement des sons au montage
  useEffect(() => {
    const preloadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const soundKeys = Object.keys(SOUNDS) as SoundKey[];

        // Chargement séquentiel pour éviter les conflits
        for (const key of soundKeys) {
          try {
            if (!SOUNDS[key].soundObject) {
              console.log(`Preloading sound ${key}...`);
              const { sound } = await Audio.Sound.createAsync(SOUNDS[key].asset);
              SOUNDS[key].soundObject = sound;
              await new Promise(resolve => setTimeout(resolve, 100)); // Petit délai entre chaque chargement
            }
          } catch (error) {
            console.error(`Failed to preload sound ${key}:`, error);
          }
        }
      } catch (error) {
        console.error('Audio initialization error:', error);
      }
    };

    preloadSounds();

    return () => {
      // Nettoyage
      const soundKeys = Object.keys(SOUNDS) as SoundKey[];
      soundKeys.forEach((key) => {
        if (SOUNDS[key].soundObject) {
          SOUNDS[key].soundObject.unloadAsync().catch(console.error);
        }
      });
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