import { createSlice } from '@reduxjs/toolkit';

interface VideoState {
  isRecording: boolean;
  hasCameraPermission: boolean;
}

const initialState: VideoState = {
  isRecording: false,
  hasCameraPermission: false,
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
    },
    stopRecording: (state) => {
      state.isRecording = false;
    },
    setCameraPermission: (state, action) => {
      state.hasCameraPermission = action.payload;
    },
  },
});

export const { startRecording, stopRecording, setCameraPermission } = videoSlice.actions;
export default videoSlice.reducer;

// to do : utiliser ce slice pour la logique de caméra embarquer
