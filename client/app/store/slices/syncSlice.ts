import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

interface SyncItem {
  id: string;
  type: 'trajet' | 'roadbook' | 'profile' | 'other' | 'api';
  data: any;
  createdAt: number;
}

interface SyncState {
  pendingItems: SyncItem[];
  syncing: boolean;
  lastSyncAttempt: number | null;
  syncErrors: Record<string, string>;
}

const initialState: SyncState = {
  pendingItems: [],
  syncing: false,
  lastSyncAttempt: null,
  syncErrors: {},
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    addPendingItem: (state, action: PayloadAction<Omit<SyncItem, 'createdAt'>>) => {
      state.pendingItems.push({
        ...action.payload,
        createdAt: Date.now(),
      });
    },
    removePendingItem: (state, action: PayloadAction<{ id: string; force?: boolean }>) => {
      state.pendingItems = state.pendingItems.filter((item) => {
        // on ne supprimer pas les items de type 'api' sauf si force=true
        if (item.type === 'api' && !action.payload.force) {
          return true;
        }
        return item.id !== action.payload.id;
      });
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.syncing = action.payload;
      if (action.payload) {
        state.lastSyncAttempt = Date.now();
      }
    },
    setSyncError: (state, action: PayloadAction<{ id: string; error: string }>) => {
      state.syncErrors[action.payload.id] = action.payload.error;
    },
    clearSyncError: (state, action: PayloadAction<string>) => {
      delete state.syncErrors[action.payload];
    },
    clearAllPendingItems: (state, action: PayloadAction<{ force?: boolean }>) => {
      if (action.payload.force) {
        state.pendingItems = [];
      } else {
        state.pendingItems = state.pendingItems.filter((item) => item.type === 'api');
      }
      state.syncErrors = {};
    },
  },
});

export const {
  addPendingItem,
  removePendingItem,
  setSyncing,
  setSyncError,
  clearSyncError,
  clearAllPendingItems,
} = syncSlice.actions;

export default syncSlice.reducer;

export const selectAllPendingItems = (state: { sync: SyncState }) => state.sync.pendingItems;
export const selectPendingItems = createSelector([selectAllPendingItems], (pendingItems) =>
  pendingItems.filter((item) => item.type !== 'api')
);
export const selectPendingCount = createSelector(
  [selectPendingItems],
  (pendingItems) => pendingItems.length
);
export const selectIsSyncing = (state: { sync: SyncState }) => state.sync.syncing;
export const selectSyncErrors = (state: { sync: SyncState }) => state.sync.syncErrors;
