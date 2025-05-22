import React, { createContext, useContext } from 'react';
import { RoadTypes } from '../types/session.types';

type RoadContextType = {
  roads: RoadTypes[];
};

const RoadContext = createContext<RoadContextType>({ roads: [] });

export const useRoads = () => useContext(RoadContext);

export const RoadProvider = ({
  children,
  roads,
}: {
  children: React.ReactNode;
  roads: RoadTypes[];
}) => {
  return (
    <RoadContext.Provider value={{ roads }}>
      {children}
    </RoadContext.Provider>
  );
};
