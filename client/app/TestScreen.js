import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TextInput } from 'react-native';
import axios from 'axios';
import { Platform } from 'react-native';

// API test component
export default function TestScreen() {
  const [results, setResults] = useState([]);
  const [apiUrl, setApiUrl] = useState('https://haep9vw-anonymous-8081.exp.direct/api');
  const [loading, setLoading] = useState(false);

  // Add a log message to the results
  const log = (message, success = true) => {
    setResults((prev) => [...prev, { message, timestamp: new Date().toISOString(), success }]);
  };

  // Clear logs
  const clearLogs = () => {
    setResults([]);
  };

  // Test status endpoint
  const testStatus = async () => {
    try {
      setLoading(true);
      log(`Testing status endpoint: ${apiUrl}/status`);
      const response = await axios.get(`${apiUrl}/status`);
      log(`Status response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } catch (error) {
      log(`Status error: ${error.message}`, false);
      if (error.response) {
        log(`Status response error: ${JSON.stringify(error.response.data)}`, false);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Test special test login endpoint
  const testTestLogin = async () => {
    try {
      setLoading(true);
      log(`Testing test-login endpoint: ${apiUrl}/test-login`);
      const response = await axios.post(`${apiUrl}/test-login`, {
        testField: 'This is a test request from Expo Go',
        platform: Platform.OS,
      });
      log(`Test login response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } catch (error) {
      log(`Test login error: ${error.message}`, false);
      if (error.response) {
        log(`Test login response error: ${JSON.stringify(error.response.data)}`, false);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Test actual login endpoint
  const testRealLogin = async () => {
    try {
      setLoading(true);
      log(`Testing real login endpoint: ${apiUrl}/auth/login`);
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email: 'user@roadbook.com',
        password: 'Password123!',
      });
      log(`Real login response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } catch (error) {
      log(`Real login error: ${error.message}`, false);
      if (error.response) {
        log(`Real login response error: ${JSON.stringify(error.response.data)}`, false);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    clearLogs();
    log('Starting API tests...');
    log(`Platform: ${Platform.OS}`);

    await testStatus();
    await testTestLogin();
    await testRealLogin();

    log('Tests completed!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Tester</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>API URL:</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="Enter API URL"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Run All Tests" onPress={runAllTests} disabled={loading} />
        <View style={styles.buttonGap} />
        <Button title="Test Status" onPress={testStatus} disabled={loading} />
        <View style={styles.buttonGap} />
        <Button title="Test Login" onPress={testRealLogin} disabled={loading} />
        <View style={styles.buttonGap} />
        <Button title="Clear Logs" onPress={clearLogs} disabled={loading} />
      </View>

      <ScrollView style={styles.logContainer}>
        {results.map((entry, index) => (
          <Text
            key={index}
            style={[styles.logEntry, entry.success ? styles.successLog : styles.errorLog]}
          >
            {entry.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonGap: {
    width: 10,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#202020',
    padding: 10,
    borderRadius: 4,
  },
  logEntry: {
    fontSize: 14,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  successLog: {
    color: '#4caf50',
  },
  errorLog: {
    color: '#f44336',
  },
});
