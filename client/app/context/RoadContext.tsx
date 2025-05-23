import React, { createContext, useContext } from 'react';
import { RoadTypes } from '../types/session.types';

type RoadContextType = {
  roads: RoadTypes[];
  refreshRoads: () => void;
};

const RoadContext = createContext<RoadContextType>({ 
  roads: [], 
  refreshRoads: () => {} 
});

export const useRoads = () => useContext(RoadContext);

export const RoadProvider = ({
  children,
  roads,
  refreshRoads,
}: {
  children: React.ReactNode;
  roads: RoadTypes[];
  refreshRoads: () => void;
}) => {
  return (
    <RoadContext.Provider value={{ roads, refreshRoads }}>
      {children}
    </RoadContext.Provider>
  );
};