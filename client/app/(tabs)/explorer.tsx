// TestSessionsPage.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import sessionApi from '../services/api/session.api';
import { Session } from '../types/session.types';

const TestSessionsPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [deleteCountInput, setDeleteCountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger toutes les sessions
  const loadAllSessions = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading all sessions...');
      const allSessions = await sessionApi.getUserSessions();
      console.log('Sessions loaded:', allSessions.length);
      setSessions(allSessions);
      if (allSessions.length > 0) {
        setSessionIdInput(allSessions[0].id); // Pré-remplir avec le premier ID
      }
    } catch (err) {
      setError('Failed to load sessions: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger une session spécifique
  const loadSpecificSession = async () => {
    if (!sessionIdInput) {
      setError('Please enter a session ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('Loading session with ID:', sessionIdInput);
      const session = await sessionApi.getSessionById(sessionIdInput);
      console.log('Session details loaded:', session);
      setSelectedSession(session);
    } catch (err) {
      setError('Failed to load session: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une session
  const deleteSession = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      await sessionApi.deleteSession(id);
      Alert.alert('Success', 'Session deleted successfully');

      // Recharger la liste
      await loadAllSessions();
      setSelectedSession(null);
    } catch (err) {
      setError('Failed to delete session: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format date function to handle different date formats
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'None';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Helper to handle undefined or null values safely
  const displayValue = (value: any, defaultValue = 'None') => {
    return value !== undefined && value !== null ? value : defaultValue;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Session API Test Page</Text>

      {/* Section pour charger toutes les sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Load All Sessions</Text>
        <Button
          title={loading ? 'Loading...' : 'Load All Sessions'}
          onPress={loadAllSessions}
          disabled={loading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {sessions.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultTitle}>Sessions Found: {sessions.length}</Text>
            {sessions.map(session => (
              <View key={session.id} style={styles.sessionItem}>
                <Text>ID: {session.id}</Text>
                <Text>Title: {displayValue(session.title)}</Text>
                <Text>Date: {formatDate(session.date)}</Text>
                <Text>Type: {displayValue(session.sessionType)}</Text>
                <Text>Status: {displayValue(session.status)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Section pour charger une session spécifique */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Load Specific Session</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Session ID"
          value={sessionIdInput}
          onChangeText={setSessionIdInput}
          editable={!loading}
        />

        <Button
          title={loading ? 'Loading...' : 'Load Session'}
          onPress={loadSpecificSession}
          disabled={loading || !sessionIdInput}
        />

        {selectedSession && (
          <View style={styles.results}>
            <Text style={styles.resultTitle}>Session Details</Text>
            <Text>ID: {selectedSession.id}</Text>
            <Text>Title: {displayValue(selectedSession.title)}</Text>
            <Text>Date: {formatDate(selectedSession.date)}</Text>
            <Text>Start: {formatDate(selectedSession.startTime)}</Text>
            <Text>End: {formatDate(selectedSession.endTime)}</Text>
            <Text>Type: {displayValue(selectedSession.sessionType)}</Text>
            <Text>Duration: {displayValue(selectedSession.duration)} minutes</Text>
            <Text>Distance: {displayValue(selectedSession.distance)} km</Text>
            <Text>Status: {displayValue(selectedSession.status)}</Text>
            <Text>Weather: {displayValue(selectedSession.weather)}</Text>
            <Text>Daylight: {displayValue(selectedSession.daylight)}</Text>
            <Text>Start Location: {displayValue(selectedSession.startLocation)}</Text>
            <Text>End Location: {displayValue(selectedSession.endLocation)}</Text>
            <Text>Road Types: {selectedSession.roadTypes?.join(', ') || 'None'}</Text>

            <Text style={styles.sectionSubtitle}>Description:</Text>
            <Text style={styles.textBlock}>{displayValue(selectedSession.description)}</Text>

            <Text style={styles.sectionSubtitle}>Notes:</Text>
            <Text style={styles.textBlock}>{displayValue(selectedSession.notes)}</Text>

            <Text>Apprentice: {displayValue(selectedSession.apprentice?.displayName || selectedSession.apprenticeId)}</Text>
            <Text>Validator: {displayValue(selectedSession.validator?.displayName || selectedSession.validatorId)}</Text>

            <Text style={styles.sectionSubtitle}>Waypoints:</Text>
            <Text>Count: {selectedSession.routeData?.waypoints?.length || 0}</Text>
            {selectedSession.routeData?.path && selectedSession.routeData.path.length > 0 ? (
              <View style={styles.waypointsContainer}>
                <Text>First: {JSON.stringify(selectedSession.routeData.path[0])}</Text>
                {selectedSession.routeData.path.length > 1 && (
                  <Text>Last: {JSON.stringify(selectedSession.routeData.path[selectedSession.routeData.path.length - 1])}</Text>
                )}
              </View>
            ) : (
              <Text>No waypoints available</Text>
            )}

            <Button
              title="Delete This Session"
              onPress={() => deleteSession(selectedSession.id)}
              color="#ff4444"
              disabled={loading}
            />
          </View>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Batch Delete</Text>

        <TextInput
          style={styles.input}
          placeholder="Number of sessions to delete (or 'all')"
          value={deleteCountInput}
          onChangeText={setDeleteCountInput}
          editable={!loading}
        />

        <Button
          title={loading ? 'Deleting...' : 'Delete Recent Sessions'}
          onPress={async () => {
            const count = deleteCountInput === 'all'
              ? Infinity
              : parseInt(deleteCountInput) || 0;

            if (count <= 0 && count !== Infinity) {
              setError('Please enter a valid number or "all"');
              return;
            }

            setLoading(true);
            try {
              const deleted = await sessionApi.deleteMultipleSessions({ limit: count });
              Alert.alert('Success', `Deleted ${deleted} sessions`);
              await loadAllSessions(); // Recharger la liste
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !deleteCountInput}
          color="#ff4444"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    marginBottom: 120,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  results: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sessionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  error: {
    color: 'red',
    marginTop: 5,
  },
  textBlock: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  waypointsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  }
});

export default TestSessionsPage;