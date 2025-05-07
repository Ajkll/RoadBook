import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SoundConfig, SoundKey, SoundState } from '../../constants/sound';
import { SOUNDS } from '../../constants/sound';

const initialState = {
  globalVolume: 1.0,
  globalMute: false,
  sounds: Object.keys(SOUNDS).reduce(
    (acc, key) => {
      const soundKey = key as SoundKey;
      acc[soundKey] = SOUNDS[soundKey].defaultConfig;
      return acc;
    },
    {} as Record<SoundKey, SoundConfig>
  ),
};

export const soundSlice = createSlice({
  name: 'sound',
  initialState,
  reducers: {
    setGlobalVolume: (state, action: PayloadAction<number>) => {
      state.globalVolume = action.payload;
    },
    setGlobalMute: (state, action: PayloadAction<boolean>) => {
      state.globalMute = action.payload;
    },
    updateSoundConfig: (
      state,
      action: PayloadAction<{ key: SoundKey; config: Partial<SoundConfig> }>
    ) => {
      const { key, config } = action.payload;
      if (state.sounds[key]) {
        state.sounds[key] = { ...state.sounds[key]!, ...config };
      }
    },
    resetAllSounds: (state) => {
      Object.keys(SOUNDS).forEach((key) => {
        const soundKey = key as SoundKey;
        state.sounds[soundKey] = SOUNDS[soundKey].defaultConfig;
      });
      state.globalVolume = 1.0;
      state.globalMute = false;
    },
  },
});

export const { setGlobalVolume, setGlobalMute, updateSoundConfig, resetAllSounds } =
  soundSlice.actions;

export default soundSlice.reducer;
