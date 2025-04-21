import React, { useEffect, useRef, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { Platform, View, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import CustomDrawerContent from './components/layout/CustomDrawerContent';
import { GestureHandlerRootView , PanGestureHandler  } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './constants/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Provider } from 'react-redux';
import store from './store/store';
import ChronoWatcher from './components/ChronoWatcher';
import * as Device from 'expo-device';
import Toast from 'react-native-toast-message';
import OfflineToast from './components/ui/OfflineToast';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import SyncInitializer from './components/SyncInitializer';
import NetworkSyncManager from './components/NetworkSyncManager';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';


function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, dark } = useTheme();
  const { isConnected, isInternetReachable } = useNetworkStatus();


  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: true,
            title: 'Connexion',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            headerShown: true,
            title: 'Inscription',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }}
        />
      </Stack>
    );
  }

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        initialRouteName="(tabs)" // écrant par defaut
        screenOptions={{
          headerShown: false,
          drawerType: Platform.OS === 'web' ? 'permanent' : 'front',
          drawerStyle: {
            backgroundColor: colors.background,
            width: 310,
            elevation: 1000,
            zIndex: 1000,
          },
          overlayColor: 'rgba(0,0,0,0.5)',
          swipeEdgeWidth: 100,
          gestureEnabled: true,
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            title: 'RoadBook Tracker',
            drawerLabel: 'Accueil',
            headerShown: false
          }}
        />

        <Drawer.Screen
          name="OfflineSyncScreen"
          options={{
            title: 'Synchronisation Offline',
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.backgroundText,
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 20
            }
          }}
        />
        <Drawer.Screen name="DashboardScreen" options={{ title: 'Dashboard', drawerLabel: 'Dashboard' }} />
        <Drawer.Screen name="MyRoadbookScreen" options={{ title: 'Mon Carnet', drawerLabel: 'Mon Carnet' }} />
        <Drawer.Screen name="MyRoutesScreen" options={{ title: 'Mes trajets', drawerLabel: 'Mes trajets' }} />
        <Drawer.Screen name="CommunityScreen" options={{ title: 'Communauté', drawerLabel: 'Communauté' }} />
        <Drawer.Screen name="MentorsScreen" options={{ title: 'Mentors', drawerLabel: 'Mentors' }} />
        <Drawer.Screen name="SkillsScreen" options={{ title: 'Compétences', drawerLabel: 'Compétences' }} />
        <Drawer.Screen name="MarketplaceScreen" options={{ title: 'Marketplace', drawerLabel: 'Marketplace' }} />
        <Drawer.Screen name="SettingsScreen" options={{ title: 'Paramètres', drawerLabel: 'Paramètres' }} />
        <Drawer.Screen name="PrivacyScreen" options={{ title: 'Confidentialité', drawerLabel: 'Confidentialité' }} />
        <Drawer.Screen name="ShareScreen" options={{ title: 'Partager', drawerLabel: 'Partager' }} />
        <Drawer.Screen name="HelpScreen" options={{ title: 'Aide', drawerLabel: 'Aide' }} />
        <Drawer.Screen name="AboutUsScreen" options={{ title: 'À propos de nous', drawerLabel: 'À propos de nous' }} />
        <Drawer.Screen name="StartDriveScreen" options={{ title: 'Démarrer', drawerLabel: 'Démarrer' }} />
        <Drawer.Screen name="ProfileScreen" options={{ title: 'Profil', drawerLabel: 'Profil' }} />
      </Drawer>
      <OfflineToast />
    </>
  );
}

// logique pour gérer le statut réseau globalement
function NetworkStatusHandler() {
  useNetworkStatus();
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ChronoWatcher />
          <SyncInitializer />
          <NetworkSyncManager />
          <ThemeProvider>
            <AuthProvider>
              <RootNavigator />
              <Toast />
            </AuthProvider>
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// to do : ajout de log securiser et chiffrer / de performance et d'erreurs / interface de monitoring server de log etc etc ...
// to do : gérer proprement pour la version web (plus compliquer que prévue)
// to do regler le probleme de la banniere offline qui ne passe pas en dessous du drawer et le toast qui s'affiche plus