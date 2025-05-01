// SettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Header from './components/layout/Header';
import BottomNavigation from './components/ui/BottomNavigation';
import {
  registerForPushNotificationsAsync,
  scheduleMotivationalNotification,
} from './utils/notifications';
import * as Notifications from 'expo-notifications';

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [soundEnable, setSoundEnabled] = useState(true);
  const [useMiles, setUseMiles] = useState(false);

  useEffect(() => {
    if (notificationsEnabled) {
      setupNotifications();
    } else {
      cancelAllNotifications();
    }
  }, [notificationsEnabled]);

  const setupNotifications = async () => {
    const token = await registerForPushNotificationsAsync();
    if (!token) {
      setNotificationsEnabled(false);
      return;
    }

    await scheduleMotivationalNotification(25, 'daily'); // 25km restant (exemple)
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const toggleNotifications = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Non pris en charge', 'Les notifications ne sont pas disponibles sur le web.');
      return;
    }
    setNotificationsEnabled((prev) => !prev);
  };

  const toggleDarkMode = () => setDarkModeEnabled((prev) => !prev);
  const toggleSound = () => setSoundEnabled((prev) => !prev);
  const toggleUnits = () => setUseMiles((prev) => !prev);

  return (
    <View style={[styles.container, darkModeEnabled && styles.darkBackground]}>
      <StatusBar style={darkModeEnabled ? 'light' : 'dark'} />
      <Header title="Paramètres" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Notifications */}
        <View style={styles.settingItem}>
          <Text style={[styles.label, darkModeEnabled && styles.darkText]}>
            Activer les notifications
          </Text>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>

        {/* Mode sombre */}
        <View style={styles.settingItem}>
          <Text style={[styles.label, darkModeEnabled && styles.darkText]}>Mode sombre</Text>
          <Switch value={darkModeEnabled} onValueChange={toggleDarkMode} />
        </View>

        {/* Son */}
        <View style={styles.settingItem}>
          <Text style={[styles.label, darkModeEnabled && styles.darkText]}>Activer le son</Text>
          <Switch value={soundEnable} onValueChange={toggleSound} />
        </View>

        {/* Unité de mesure */}
        <View style={styles.settingItem}>
          <Text style={[styles.label, darkModeEnabled && styles.darkText]}>
            Unité de mesure : {useMiles ? 'Miles' : 'Kilomètres'}
          </Text>
          <Switch value={useMiles} onValueChange={toggleUnits} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkBackground: {
    backgroundColor: '#1c1c1e',
  },
  scrollContainer: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  darkText: {
    color: '#eee',
  },
});

export default SettingsScreen;
