import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roadbookReducer from './slices/roadbookSlice';
import chronoReducer from './slices/chronoSlice';
import locationReducer from './slices/locationSlice';
import vehicleReducer from './slices/vehicleSlice';
import networkSlice from './slices/networkSlice';
import syncSlice from './slices/syncSlice';
import videoReducer from './slices/videoSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    roadbook: roadbookReducer,
    chrono: chronoReducer,
    location: locationReducer,
    vehicle: vehicleReducer,
    network: networkSlice,
    sync: syncSlice,
    video: videoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
