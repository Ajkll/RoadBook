import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Roadbook {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  targetHours: number;
  createdAt: string;
  updatedAt: string;
}

interface RoadbookState {
  roadbooks: Roadbook[];
  currentRoadbook: Roadbook | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RoadbookState = {
  roadbooks: [],
  currentRoadbook: null,
  isLoading: false,
  error: null,
};

const roadbookSlice = createSlice({
  name: 'roadbook',
  initialState,
  reducers: {
    setRoadbooks: (state, action: PayloadAction<Roadbook[]>) => {
      state.roadbooks = action.payload;
    },
    setCurrentRoadbook: (state, action: PayloadAction<Roadbook | null>) => {
      state.currentRoadbook = action.payload;
    },
    addRoadbook: (state, action: PayloadAction<Roadbook>) => {
      state.roadbooks.push(action.payload);
    },
    updateRoadbook: (state, action: PayloadAction<Roadbook>) => {
      const index = state.roadbooks.findIndex((rb) => rb.id === action.payload.id);
      if (index !== -1) {
        state.roadbooks[index] = action.payload;
      }
      if (state.currentRoadbook?.id === action.payload.id) {
        state.currentRoadbook = action.payload;
      }
    },
    deleteRoadbook: (state, action: PayloadAction<string>) => {
      state.roadbooks = state.roadbooks.filter((rb) => rb.id !== action.payload);
      if (state.currentRoadbook?.id === action.payload) {
        state.currentRoadbook = null;
      }
    },
    setRoadbookLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setRoadbookError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setRoadbooks,
  setCurrentRoadbook,
  addRoadbook,
  updateRoadbook,
  deleteRoadbook,
  setRoadbookLoading,
  setRoadbookError,
} = roadbookSlice.actions;

export default roadbookSlice.reducer;
