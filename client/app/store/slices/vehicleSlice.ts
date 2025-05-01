import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type VehicleType = 'voiture' | 'moto' | 'camion' | 'camionette';

interface VehicleState {
  type: VehicleType;
}

const initialState: VehicleState = {
  type: 'voiture', // valeur par défault
};

const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    setVehicleType: (state, action: PayloadAction<VehicleType>) => {
      state.type = action.payload;
    },
  },
});

export const { setVehicleType } = vehicleSlice.actions;
export default vehicleSlice.reducer;
