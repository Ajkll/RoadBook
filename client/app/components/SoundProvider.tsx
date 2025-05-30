import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Audio } from 'expo-av';
import { RootState } from '../store/store';
import { logger } from '../utils/logger';
import { unloadAllSounds } from '../utils/soundPlayer';

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { globalMute } = useSelector((state: RootState) => state.sound);

  // Ne pas appeler setAudioModeAsync en dehors d'un useEffect pour éviter les appels multiples

  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: !globalMute,
          staysActiveInBackground: true,
          shouldDuckAndroid: !globalMute,
        });
        console.log('Audio mode set successfully');
      } catch (error) {
        logger.error('Audio init error:', error);
      }
    };

    initAudio();

    // Cleanup function to unload all sounds when component unmounts
    return () => {
      unloadAllSounds().catch(err => {
        logger.error('Error unloading sounds during cleanup:', err);
      });
    };
  }, [globalMute]);

  return <>{children}</>;
};
