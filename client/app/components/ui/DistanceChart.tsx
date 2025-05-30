import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { sessionApi } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const DistanceCharts = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'week' | 'year'>('week');

  const [tooltipPos, setTooltipPos] = useState({
    x: 0,
    y: 0,
    visible: false,
    value: 0,
  });

  const loadChartData = useCallback((data: any[], filter: 'week' | 'year') => {
    const now = new Date();

    if (filter === 'week') {
      const labels: string[] = [];
      const aggregated: Record<string, number> = {};

      const monday = new Date(now);
      const day = monday.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      monday.setDate(monday.getDate() + diff);

      const isoDates: string[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);

        const iso = d.toISOString().split('T')[0]; // yyyy-mm-dd
        isoDates.push(iso);
        labels.push(d.toLocaleDateString('fr-FR', { weekday: 'short' }));
        aggregated[iso] = 0;
      }

      data.forEach(session => {
        const date = new Date(session.date);
        const iso = date.toISOString().split('T')[0];
        if (aggregated.hasOwnProperty(iso)) {
          aggregated[iso] += session.distance || 0;
        }
      });

      setChartData({
        labels,
        datasets: [
          {
            data: isoDates.map(iso => aggregated[iso] || 0),
            strokeWidth: 2,
          },
        ],
      });
    }

    if (filter === 'year') {
      const monthlyLabels: string[] = [];
      const monthlyAggregated: Record<string, number> = {};

      for (let i = 0; i < 12; i++) {
        const key = `${now.getFullYear()}-${(i + 1).toString().padStart(2, '0')}`; // yyyy-mm
        monthlyLabels.push(
          new Date(now.getFullYear(), i, 1).toLocaleDateString('fr-FR', { month: 'short' })
        );
        monthlyAggregated[key] = 0;
      }

      data.forEach(session => {
        const date = new Date(session.date);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (monthlyAggregated.hasOwnProperty(key)) {
          monthlyAggregated[key] += session.distance || 0;
        }
      });

      setChartData({
        labels: monthlyLabels,
        datasets: [
          {
            data: Object.values(monthlyAggregated),
            strokeWidth: 2,
          },
        ],
      });
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const result = await sessionApi.getUserSessions();
      setSessions(result);
      setError(null);
      loadChartData(result, filter);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données.');
    }
  }, [filter, loadChartData]);

  useFocusEffect(fetchSessions);

  const handleFilterChange = (value: 'week' | 'year') => {
    setFilter(value);
    loadChartData(sessions, value);
  };

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!chartData) {
    return <Text style={styles.loadingText}>Chargement des données...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distance parcourue ({filter})</Text>

      <View style={styles.buttonGroup}>
        {['week', 'year'].map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.button, filter === option && styles.activeButton]}
            onPress={() => handleFilterChange(option as 'week' | 'year')}
          >
            <Text
              style={[styles.buttonText, filter === option && styles.activeButtonText]}
            >
              {option === 'week' ? 'Semaine' : 'Année'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <LineChart
        data={chartData}
        width={screenWidth - 100}
        height={220}
        yAxisSuffix=" km"
        chartConfig={{
          backgroundColor: '#e8f0fe',
          backgroundGradientFrom: '#e8f0fe',
          backgroundGradientTo: '#cfd8dc',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          labelColor: () => '#000',
        }}
        style={styles.chart}
        bezier={false}
        onDataPointClick={(data) => {
          const isSamePoint = tooltipPos.x === data.x && tooltipPos.y === data.y;
          setTooltipPos({
            x: data.x,
            y: data.y,
            value: data.value,
            visible: !isSamePoint || !tooltipPos.visible,
          });
        }}
      />

      {tooltipPos.visible && (
        <View style={{
          position: 'absolute',
          top: tooltipPos.y + 60,
          left: tooltipPos.x + 30,
          backgroundColor: 'white',
          padding: 6,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#2196f3',
        }}>
          <Text style={{ color: '#000' }}>{tooltipPos.value.toFixed(1)} km</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 0.3,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
  loadingText: {
    color: '#888',
    textAlign: 'center',
    margin: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#e0e0e0',
  },
  activeButton: {
    backgroundColor: '#2196f3',
  },
  buttonText: {
    color: '#333',
    fontSize: 14,
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DistanceCharts;
