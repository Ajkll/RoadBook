import { createSlice } from '@reduxjs/toolkit';

interface ChronoState {
  isRunning: boolean;
  elapsedTime: number; // en sec
  shouldSave: boolean;
}

const initialState: ChronoState = {
  isRunning: false,
  elapsedTime: 0,
  shouldSave: true,
};

export const chronoSlice = createSlice({
  name: 'chrono',
  initialState,
  reducers: {
    startChrono: (state) => {
      if (!state.isRunning) {
        state.isRunning = true;
        state.shouldSave = true;
      }
    },
    finishChrono: (state) => {
      state.isRunning = false;
    },
    resetChrono: (state) => {
      state.isRunning = false;
      state.elapsedTime = 0;
      state.shouldSave = true;
    },
    setShouldSave: (state, action: PayloadAction<boolean>) => {
      state.shouldSave = action.payload;
    },
    tick: (state) => {
      if (state.isRunning) {
        state.elapsedTime += 1;
      }
    },
  },
});

export const { startChrono, finishChrono, resetChrono, tick, setShouldSave } = chronoSlice.actions;

export default chronoSlice.reducer;
