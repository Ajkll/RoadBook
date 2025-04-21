import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string | null;
  details: object | null;
}

const initialState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  details: null
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkStatus: (state, action: PayloadAction<NetworkState>) => {
      state.isConnected = action.payload.isConnected;
      state.isInternetReachable = action.payload.isInternetReachable;
      state.connectionType = action.payload.connectionType;
      state.details = action.payload.details;
    }
  }
});

export const { setNetworkStatus } = networkSlice.actions;
export default networkSlice.reducer;


export const selectIsConnected = (state: { network: NetworkState }) => state.network.isConnected;
export const selectIsInternetReachable = (state: { network: NetworkState }) => state.network.isInternetReachable;
export const selectNetworkDetails = (state: { network: NetworkState }) => ({
  connectionType: state.network.connectionType,
  details: state.network.details
});