import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter, usePathname } from 'expo-router';
import MyRoutes from '../../app/(tabs)/my-routes/stats';
import { useTheme } from '../../app/constants/theme';
import { useRoads } from '../../app/context/RoadContext';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('../../app/constants/theme', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../app/context/RoadContext', () => ({
  useRoads: jest.fn(),
}));

jest.mock('../../app/components/ui/ProgressBar', () => {
  return function ProgressBar({ title, distanceKm }) {
    const { Text } = require('react-native');
    return <Text testID="progress-bar">{`${title}: ${distanceKm}km`}</Text>;
  };
});

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
  PanGestureHandler: ({ children, onGestureEvent }) => {
    const { View } = require('react-native');
    return (
      <View testID="pan-gesture-handler" onTouchMove={onGestureEvent}>
        {children}
      </View>
    );
  },
}));

describe('MyRoutes', () => {
  const mockRouter = { push: jest.fn() };
  const mockColors = {
    background: '#ffffff',
    primaryText: '#000000',
    primary: '#007AFF',
    primaryDarker: '#0051D0',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
    useTheme.mockReturnValue({ colors: mockColors });
  });

  describe('Rendu initial', () => {
    it('devrait rendre le composant correctement avec des données vides', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      useRoads.mockReturnValue({ roads: [] });

      const { getByText, getByTestId } = render(<MyRoutes />);

      expect(getByTestId('progress-bar')).toBeTruthy();
      expect(getByText('Heures totales')).toBeTruthy();
      expect(getByText('Distance totale')).toBeTruthy();
      expect(getByText('0 min')).toBeTruthy();
      expect(getByText('0 km')).toBeTruthy();
    });

    it('devrait rendre correctement avec des données undefined', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      useRoads.mockReturnValue({ roads: undefined });

      const { getByText } = render(<MyRoutes />);

      expect(getByText('0 min')).toBeTruthy();
      expect(getByText('0 km')).toBeTruthy();
    });

    it('devrait rendre correctement avec des données null', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      useRoads.mockReturnValue({ roads: null });

      const { getByText } = render(<MyRoutes />);

      expect(getByText('0 min')).toBeTruthy();
      expect(getByText('0 km')).toBeTruthy();
    });
  });

  describe('Calcul des statistiques', () => {
    it('devrait calculer correctement les totaux avec des données valides', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      const mockRoads = [
        { duration: 30, distance: 10 },
        { duration: 45, distance: 15 },
        { duration: 90, distance: 25 },
      ];
      useRoads.mockReturnValue({ roads: mockRoads });

      const { getByText, getByTestId } = render(<MyRoutes />);

      expect(getByText('2h 45min')).toBeTruthy(); // 165 minutes = 2h 45min
      expect(getByText('50 km')).toBeTruthy();
      expect(getByTestId('progress-bar')).toHaveTextContent('Progression: 50km');
    });

    it('devrait gérer les valeurs manquantes dans les données', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      const mockRoads = [
        { duration: 30, distance: 10 },
        { duration: null, distance: undefined },
        { distance: 15 },
        { duration: 45 },
      ];
      useRoads.mockReturnValue({ roads: mockRoads });

      const { getByText } = render(<MyRoutes />);

      expect(getByText('1h 15min')).toBeTruthy(); // 30 + 45 = 75 minutes
      expect(getByText('25 km')).toBeTruthy(); // 10 + 15 = 25
    });

    it('devrait calculer correctement avec des objets vides', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      const mockRoads = [{}, {}, {}];
      useRoads.mockReturnValue({ roads: mockRoads });

      const { getByText } = render(<MyRoutes />);

      expect(getByText('0 min')).toBeTruthy();
      expect(getByText('0 km')).toBeTruthy();
    });
  });

  describe('Formatage de la durée', () => {
    it('devrait formater correctement les durées en minutes seulement', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      const mockRoads = [{ duration: 45, distance: 10 }];
      useRoads.mockReturnValue({ roads: mockRoads });

      const { getByText } = render(<MyRoutes />);

      expect(getByText('45 min')).toBeTruthy();
    });

    it('devrait formater correctement les heures exactes', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      const mockRoads = [{ duration: 120, distance: 10 }];
      useRoads.mockReturnValue({ roads: mockRoads });

      const { getByText } = render(<MyRoutes />);

      expect(getByText('2h')).toBeTruthy();
    });

    it('devrait formater correctement les heures avec minutes', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      const mockRoads = [{ duration: 150, distance: 10 }];
      useRoads.mockReturnValue({ roads: mockRoads });

      const { getByText } = render(<MyRoutes />);

      expect(getByText('2h 30min')).toBeTruthy();
    });

    it('devrait gérer la durée zéro', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      const mockRoads = [{ duration: 0, distance: 10 }];
      useRoads.mockReturnValue({ roads: mockRoads });

      const { getByText } = render(<MyRoutes />);

      expect(getByText('0 min')).toBeTruthy();
    });
  });

  describe('Intégration des hooks', () => {
    it('devrait appeler useTheme pour récupérer les couleurs', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      useRoads.mockReturnValue({ roads: [] });

      render(<MyRoutes />);

      expect(useTheme).toHaveBeenCalled();
    });

    it('devrait appeler useRouter pour la navigation', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      useRoads.mockReturnValue({ roads: [] });

      render(<MyRoutes />);

      expect(useRouter).toHaveBeenCalled();
    });

    it('devrait appeler usePathname pour connaître la route actuelle', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      useRoads.mockReturnValue({ roads: [] });

      render(<MyRoutes />);

      expect(usePathname).toHaveBeenCalled();
    });

    it('devrait appeler useRoads pour récupérer les données', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      useRoads.mockReturnValue({ roads: [] });

      render(<MyRoutes />);

      expect(useRoads).toHaveBeenCalled();
    });
  });

  describe('Gestion du swipe', () => {
    it('devrait naviguer vers /my-roads en swipe gauche depuis /stats', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      useRoads.mockReturnValue({ roads: [] });

      const { getByTestId } = render(<MyRoutes />);

      fireEvent(getByTestId('pan-gesture-handler'), 'onTouchMove', {
        nativeEvent: { translationX: -60 },
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/my-routes/my-roads');
    });

    it('devrait naviguer vers /stats en swipe droite depuis /my-roads', () => {
      usePathname.mockReturnValue('/my-routes/my-roads');
      useRoads.mockReturnValue({ roads: [] });

      const { getByTestId } = render(<MyRoutes />);

      fireEvent(getByTestId('pan-gesture-handler'), 'onTouchMove', {
        nativeEvent: { translationX: 60 },
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)/my-routes/stats');
    });

    it('ne devrait pas naviguer si le swipe est trop faible', () => {
      usePathname.mockReturnValue('/my-routes/stats');
      useRoads.mockReturnValue({ roads: [] });

      const { getByTestId } = render(<MyRoutes />);

      fireEvent(getByTestId('pan-gesture-handler'), 'onTouchMove', {
        nativeEvent: { translationX: 30 },
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});
