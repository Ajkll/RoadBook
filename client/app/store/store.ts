import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roadbookReducer from './slices/roadbookSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    roadbook: roadbookReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
