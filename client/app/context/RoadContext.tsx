import React, { createContext, useContext } from 'react';
import { SessionData } from '../types/session.types';

type RoadContextType = {
  roads: SessionData[];
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
  roads: SessionData[];
  refreshRoads: () => void;
}) => {
  return (
    <RoadContext.Provider value={{ roads, refreshRoads }}>
      {children}
    </RoadContext.Provider>
  );
};