import { AVPlaybackStatus, Audio } from 'expo-av';

export type SoundConfig = {
  volume: number;
  isMuted: boolean;
  isAbsolutePriority: boolean;
  isSuperposable: boolean;
  canInterrupt: boolean;
};

export type SoundDefinition = {
  key: string;
  asset: any;
  defaultConfig: SoundConfig;
  soundObject?: Audio.Sound;
  status?: AVPlaybackStatus;
};

export type SoundState = {
  globalVolume: number;
  globalMute: boolean;
  sounds: {
    [key in SoundKey]?: SoundConfig;
  };
};

export const SOUNDS = {
  GPS_READY: {
    key: 'GPS_READY',
    asset: require('../assets/sounds/gps-start.mp3'),
    defaultConfig: {
      volume: 0.7,
      isMuted: false,
      isAbsolutePriority: false,
      isSuperposable: true,
      canInterrupt: false,
    },
  },
  NOTIFICATION: {
    key: 'NOTIFICATION',
    asset: require('../assets/sounds/notification-sound-1.mp3'),
    isShortSound: true,
    defaultConfig: {
      volume: 0.5,
      isMuted: false,
      isAbsolutePriority: false,
      isSuperposable: false,
      canInterrupt: true,
    },
  },
  MENU: {
    key: 'MENU',
    asset: require('../assets/sounds/menu-selection.wav'),
    isShortSound: true,
    defaultConfig: {
      volume: 0.5,
      isMuted: false,
      isAbsolutePriority: false,
      isSuperposable: false,
      canInterrupt: true,
    },
  },
  SUCCESS_SOUND: {
    key: 'SUCCESS_SOUND',
    asset: require('../assets/sounds/succes.mp3'),
    isShortSound: true,
    defaultConfig: {
      volume: 0.7,
      isMuted: false,
      isAbsolutePriority: false,
      isSuperposable: false,
      canInterrupt: true,
    },
  },
  ERROR_SOUND: {
    key: 'ERROR_SOUND',
    asset: require('../assets/sounds/error.wav'),
    isShortSound: true,
    defaultConfig: {
      volume: 0.7,
      isMuted: false,
      isAbsolutePriority: false,
      isSuperposable: false,
      canInterrupt: true,
    },
  },
  WARNING_SOUND: {
    key: 'WARNING_SOUND',
    asset: require('../assets/sounds/warning.wav'),
    isShortSound: true,
    defaultConfig: {
      volume: 0.7,
      isMuted: false,
      isAbsolutePriority: false,
      isSuperposable: false,
      canInterrupt: true,
    },
  },
  CLICK: {
    key: 'CLICK',
    asset: require('../assets/sounds/click.wav'),
    defaultConfig: {
      volume: 1.0,
      isMuted: false,
      isAbsolutePriority: true,
      isSuperposable: false,
      canInterrupt: true,
    },
  },
  SILENCE: {
    key: 'SILENCE',
    asset: require('../assets/sounds/silence_15s.mp3'),
    defaultConfig: {
      volume: 10,
      isMuted: true,
      isAbsolutePriority: false,
      isSuperposable: false,
      canInterrupt: false,
    },
  },
} as const satisfies Record<string, SoundDefinition>;

export type SoundKey = keyof typeof SOUNDS;
