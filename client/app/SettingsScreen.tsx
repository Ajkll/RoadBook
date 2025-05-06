import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Header from './components/layout/Header';
import SoundCardParameters from './components/parameters/soundCardParameters';
import { AppInfo } from './components/parameters/appInfoReport';
import { useTheme } from './constants/theme';
import GoBackHomeButton from './components/common/GoBackHomeButton';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
  registerForPushNotificationsAsync,
  scheduleMotivationalNotification,
  scheduleLocalNotification,
} from './utils/notifications';

const SettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  // États des fonctionnalités
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [useMiles, setUseMiles] = useState(false);

  // Déterminer si nous sommes dans Expo Go
  const isExpoGo = Constants.executionEnvironment === 'storeClient';

  // Gestion des notifications
  useEffect(() => {
    if (notificationsEnabled) {
      setupNotifications();
    } else {
      cancelAllNotifications();
    }
  }, [notificationsEnabled]);

  const setupNotifications = async () => {
    try {
      // Si nous sommes dans Expo Go, afficher un message informatif
      if (isExpoGo && Platform.OS !== 'web') {
        // Enregistrement des notifications locales
        const token = await registerForPushNotificationsAsync();

        if (token === undefined && Platform.OS !== 'web') {
          // Créer une notification locale de test pour montrer que les notifications fonctionnent toujours
          await scheduleLocalNotification(
            "Test de notification",
            "Les notifications locales fonctionnent dans Expo Go!",
            3
          );

          // Optionnel: Informer l'utilisateur de la limitation
          Alert.alert(
            "Mode développement",
            "Dans Expo Go, seules les notifications locales sont disponibles. Pour tester les notifications push, utilisez un build de développement.",
            [{ text: "OK" }]
          );
        }
      } else {
        // Comportement normal pour les builds de développement
        const token = await registerForPushNotificationsAsync();
        if (!token && Platform.OS !== 'web') {
          setNotificationsEnabled(false);
          return;
        }
        await scheduleMotivationalNotification(25, 'daily');
      }
    } catch (error) {
      console.error("Erreur lors de la configuration des notifications:", error);
      setNotificationsEnabled(false);
    }
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

  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const toggleDarkMode = () => setDarkModeEnabled((prev) => !prev);
  const toggleUnits = () => setUseMiles((prev) => !prev);

  const styles = createStyles(theme, darkModeEnabled);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style={darkModeEnabled ? 'light' : 'dark'} />
      <Header
        title="Paramètres"
        onMenuPress={openDrawer}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* section appInfo */}
        <AppInfo  />
        {/* section son */}
        <SoundCardParameters />
        {/* section notifications */}
        <View style={styles.settingItem}>
          <Text style={styles.label}>
            Activer les notifications
            {isExpoGo && Platform.OS !== 'web' ? ' (locales uniquement)' : ''}
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: theme.colors.secondary, true: theme.colors.primary }}
          />
        </View>

        {/* Mode sombre */}
        <View style={styles.settingItem}>
          <Text style={styles.label}>Mode sombre</Text>
          <Switch
            value={darkModeEnabled}
            onValueChange={toggleDarkMode}
            trackColor={{ false: theme.colors.secondary, true: theme.colors.primary }}
          />
        </View>

        {/* Unité de mesure */}
        <View style={styles.settingItem}>
          <Text style={styles.label}>
            Unité de mesure : {useMiles ? 'Miles' : 'Kilomètres'}
          </Text>
          <Switch
            value={useMiles}
            onValueChange={toggleUnits}
            trackColor={{ false: theme.colors.secondary, true: theme.colors.primary }}
          />
        </View>

      </ScrollView>

      <View style={styles.footerContainer}>
        <GoBackHomeButton containerStyle={{ marginTop: theme.spacing.md }} />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: any, darkMode?: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? '#1c1c1e' : theme.colors.background,
    },
    content: {
      padding: theme.spacing.md,
    },
    footerContainer: {
      padding: theme.spacing.md,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
      backgroundColor: darkMode ? '#1c1c1e' : theme.colors.background,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontSize: 16,
      color: darkMode ? '#eee' : theme.colors.text,
    },
  });

export default SettingsScreen;