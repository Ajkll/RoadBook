import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import DistanceCharts from '../../app/components/ui/DistanceChart';
import { sessionApi } from '../../app/services/api';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: any) => cb(), // appelle immédiatement le callback
}));

jest.mock('../../app/services/api', () => ({
  sessionApi: {
    getUserSessions: jest.fn(),
  },
}));

describe('DistanceCharts', () => {
  const mockSessions = [
    { date: new Date().toISOString(), distance: 5 },
    { date: new Date().toISOString(), distance: 3 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche un message de chargement pendant le fetch', async () => {
    (sessionApi.getUserSessions as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { getByText } = render(<DistanceCharts />);
    expect(getByText('Chargement des données...')).toBeTruthy();
  });

  it('affiche un message d’erreur si le fetch échoue', async () => {
    (sessionApi.getUserSessions as jest.Mock).mockRejectedValue(new Error('Erreur'));
    const { getByText } = render(<DistanceCharts />);

    await waitFor(() => {
      expect(getByText('Impossible de charger les données.')).toBeTruthy();
    });
  });

  it('affiche un graphique en mode semaine avec les bonnes données', async () => {
    (sessionApi.getUserSessions as jest.Mock).mockResolvedValue(mockSessions);
    const { getByText, queryByText } = render(<DistanceCharts />);

    await waitFor(() => {
      expect(getByText('Distance parcourue (week)')).toBeTruthy();
    });

    expect(queryByText('Chargement des données...')).toBeNull();
  });

  it('change le filtre et recharge le graphique en mode année', async () => {
    (sessionApi.getUserSessions as jest.Mock).mockResolvedValue(mockSessions);
    const { getByText } = render(<DistanceCharts />);

    await waitFor(() => {
      expect(getByText('Distance parcourue (week)')).toBeTruthy();
    });

    const yearButton = getByText('Année');
    fireEvent.press(yearButton);

    await waitFor(() => {
      expect(getByText('Distance parcourue (year)')).toBeTruthy();
    });
  });

  it('change le filtre et revient au mode semaine', async () => {
    (sessionApi.getUserSessions as jest.Mock).mockResolvedValue(mockSessions);
    const { getByText } = render(<DistanceCharts />);

    await waitFor(() => {
      expect(getByText('Distance parcourue (week)')).toBeTruthy();
    });

    const yearButton = getByText('Année');
    fireEvent.press(yearButton);
    await waitFor(() => getByText('Distance parcourue (year)'));

    const weekButton = getByText('Semaine');
    fireEvent.press(weekButton);
    await waitFor(() => {
      expect(getByText('Distance parcourue (week)')).toBeTruthy();
    });
  });
});
