import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Audio } from 'expo-av';
import { RootState } from '../store/store';
import { logger } from '../utils/logger';

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { globalMute } = useSelector((state: RootState) => state.sound);

  Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  })
    .then(() => {
      console.log('Audio mode set successfully');
    })
    .catch((error) => {
      logger.error('Failed to set audio mode:', error);
    });

  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: !globalMute,
          staysActiveInBackground: true,
          shouldDuckAndroid: !globalMute,
        });
      } catch (error) {
        logger.error('Audio init error:', error);
      }
    };

    initAudio();
  }, [globalMute]);

  return <>{children}</>;
};
