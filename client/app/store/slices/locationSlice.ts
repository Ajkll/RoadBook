import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Coord {
  latitude: number;
  longitude: number;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  tracking: boolean;
  path: Coord[];
  tempBuffer: Coord[];
  lastSavedPoint: Coord | null;
}

const initialState: LocationState = {
  latitude: null,
  longitude: null,
  tracking: false,
  path: [],
  tempBuffer: [],
  lastSavedPoint: null,
};

// buffer temporaire pour les coord GPS
const BUFFER_SIZE = 5;

// TreshHold arbitraire
const MOVEMENT_THRESHOLD = 0.00012; // Environ 10-15 mètres arbitraire (mais ca semble etre le sweetspote)

export const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    startTracking: (state) => {
      state.tracking = true;
      state.path = [];
      state.tempBuffer = [];
      state.lastSavedPoint = null;
    },
    stopTracking: (state) => {
      state.tracking = false;

      if (state.tempBuffer.length > 0) {
        const lastPoint = state.tempBuffer[state.tempBuffer.length - 1];
        if (state.path.length === 0 ||
            state.path[state.path.length - 1].latitude !== lastPoint.latitude ||
            state.path[state.path.length - 1].longitude !== lastPoint.longitude) {
          state.path.push(lastPoint);
          console.log('Point final ajouté:', lastPoint.latitude, lastPoint.longitude);
        }
      }
    },
    updateLocation: (state, action: PayloadAction<Coord>) => {
      const { latitude, longitude } = action.payload;
      state.latitude = latitude;
      state.longitude = longitude;

      if (state.tracking) {
        const newPoint = { latitude, longitude };

        if (state.path.length === 0 && state.tempBuffer.length === 0) {
          state.path.push(newPoint);
          state.lastSavedPoint = newPoint;
          state.tempBuffer.push(newPoint);
          console.log('Premier point ajouté:', latitude, longitude);
          return;
        }

        state.tempBuffer.push(newPoint);
        if (state.tempBuffer.length > BUFFER_SIZE) {
          state.tempBuffer.shift(); // FIFO basique
        }

        if (state.tempBuffer.length >= BUFFER_SIZE) {
          // on compare uniquement le premier et le dernier point du buffer
          const firstPoint = state.tempBuffer[0];
          const lastPoint = state.tempBuffer[state.tempBuffer.length - 1];

          const latDiff = Math.abs(lastPoint.latitude - firstPoint.latitude);
          const lngDiff = Math.abs(lastPoint.longitude - firstPoint.longitude);

          if (latDiff > MOVEMENT_THRESHOLD || lngDiff > MOVEMENT_THRESHOLD) {
            if (state.path.length === 0 ||
                state.path[state.path.length - 1].latitude !== lastPoint.latitude ||
                state.path[state.path.length - 1].longitude !== lastPoint.longitude) {
              state.path.push(lastPoint);
              state.lastSavedPoint = lastPoint;
              console.log('Point significatif ajouté:', lastPoint.latitude, lastPoint.longitude);

              // Vider le buffer sauf dernier point
              state.tempBuffer = [lastPoint];
            }
          } else {
            console.log('Mouvement non significatif, point ignoré');
          }
        }
      }
    },
    resetLocation: (state) => {
      state.latitude = null;
      state.longitude = null;
      state.tracking = false;
      state.path = [];
      state.tempBuffer = [];
      state.lastSavedPoint = null;
    },
  },
});

export const {
  startTracking,
  stopTracking,
  updateLocation,
  resetLocation,
} = locationSlice.actions;

export default locationSlice.reducer;