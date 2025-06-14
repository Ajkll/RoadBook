// client/app/_layout.tsx
import 'react-native-get-random-values';
import '@react-native-async-storage/async-storage';
import { enableLegacyWebImplementation } from 'react-native-gesture-handler';
enableLegacyWebImplementation(true);
import React, { useEffect, useRef, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { Platform, View, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import CustomDrawerContent from './components/layout/CustomDrawerContent';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './constants/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './context/UserContext'; // Ajout du UserContext
import { Provider } from 'react-redux';
import store from './store/store';
import { apiProxy } from './api-proxy';
import ChronoWatcher from './components/ChronoWatcher';
import * as Device from 'expo-device';
import Toast from 'react-native-toast-message';
import OfflineToast from './components/ui/OfflineToast';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import SyncInitializer from './components/SyncInitializer';
import NetworkSyncManager from './components/NetworkSyncManager';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { SoundProvider } from './components/SoundProvider';
import { NotificationHandler } from './components/NotificationHandler';
import { logger, initLogger } from './utils/logger';

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
            width: '64%',
            elevation: 1000,
            zIndex: 1000,
          },
          overlayColor: 'rgba(0,0,0,0.65)',
          swipeEdgeWidth: 100,
          gestureEnabled: true,
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            title: 'RoadBook Tracker',
            drawerLabel: 'Accueil',
            headerShown: false,
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
              fontSize: 20,
            },
          }}
        />
        <Drawer.Screen
          name="DashboardScreen"
          options={{ title: 'Dashboard', drawerLabel: 'Dashboard' }}
        />
        <Drawer.Screen
          name="PaymentScreen"
          options={{ title: 'Payment', drawerLabel: 'Payment' }}
        />
        <Drawer.Screen
          name="MyRoadbookScreen"
          options={{ title: 'Mon Carnet', drawerLabel: 'Mon Carnet' }}
        />
        <Drawer.Screen
          name="my-routes"
          options={{ title: 'Mes trajets', drawerLabel: 'Mes trajets' }}
        />
        <Drawer.Screen
          name="CommunityScreen"
          options={{ title: 'Communauté', drawerLabel: 'Communauté' }}
        />
        <Drawer.Screen
          name="MentorsScreen"
          options={{ title: 'Mentors', drawerLabel: 'Mentors' }}
        />
        <Drawer.Screen
          name="SkillsScreen"
          options={{ title: 'Compétences', drawerLabel: 'Compétences' }}
        />
        <Drawer.Screen
          name="MarketplaceScreen"
          options={{ title: 'Marketplace', drawerLabel: 'Marketplace' }}
        />
        <Drawer.Screen
          name="SettingsScreen"
          options={{ title: 'Paramètres', drawerLabel: 'Paramètres' }}
        />
        <Drawer.Screen
          name="PrivacyScreen"
          options={{ title: 'Confidentialité', drawerLabel: 'Confidentialité' }}
        />
        <Drawer.Screen
          name="ShareScreen"
          options={{ title: 'Partager', drawerLabel: 'Partager' }}
        />
        <Drawer.Screen name="HelpScreen" options={{ title: 'Aide', drawerLabel: 'Aide' }} />
        <Drawer.Screen
          name="AboutUsScreen"
          options={{ title: 'À propos de nous', drawerLabel: 'À propos de nous' }}
        />
        <Drawer.Screen
          name="StartDriveScreen"
          options={{ title: 'Démarrer', drawerLabel: 'Démarrer' }}
        />
        <Drawer.Screen name="ProfileScreen" options={{ title: 'Profile', drawerLabel: 'Profile' }} />
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
  const [isLoggerReady, setIsLoggerReady] = useState(false);
  // Initialiser la configuration du proxy API et du logging
  useEffect(() => {
      const initializeApp = async () => {
        try {
          // Initialisation du logger
          await initLogger();
          setIsLoggerReady(true);

          // Initialisation du stockage sécurisé
          try {
            const { initializeSecureStorage, diagnoseStorage } = await import('./services/secureStorage');
            
            // Vérifier que le stockage sécurisé fonctionne correctement
            const storageStatus = await initializeSecureStorage();
            logger.info(`Storage initialization: ${storageStatus.success ? 'SUCCESS' : 'FAILED'}`);
            logger.info(`Using storage type: ${storageStatus.storageType}`);
            
            // En cas d'échec, diagnostiquer le problème
            if (!storageStatus.success) {
              logger.error(`Storage initialization failed: ${storageStatus.reason}`);
              
              // Faire un diagnostic complet
              const diagnosticResult = await diagnoseStorage();
              logger.error('Storage diagnostic:', diagnosticResult);
              
              // Alerte en mode développement
              if (__DEV__) {
                console.warn('Secure storage initialization failed - using fallback mechanism', 
                  storageStatus.reason);
              }
            }
          } catch (storageError) {
            logger.error('Storage initialization error:', storageError);
          }

          console.log(`App started on Platform: ${Platform.OS}`);
          console.log(`API URL: ${apiProxy.getBaseUrl()}`);

          // Si on est en dev, lancer un test de connexion basique
          if (__DEV__) {
            setTimeout(async () => {
              try {
                console.log('Testing API connection...');
                const result = await fetch(apiProxy.getUrl('/health'), {
                  method: 'GET',
                  headers: { 'Accept': 'application/json' }
                });
                console.log(`API connection test: ${result.status}`);
              } catch (error) {
                console.error('API connection test failed:', error);
              }
            }, 2000);
          }
        } catch (error) {
          console.error('Initialization failed:', error);
        }
      };

      initializeApp();
    }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <SoundProvider>
            <ChronoWatcher />
            <SyncInitializer />
            <NetworkSyncManager />
            <ThemeProvider>
              <AuthProvider>
                {isLoggerReady && (
                  <UserProvider>
                    <RootNavigator />
                    <NotificationHandler />
                  </UserProvider>
                )}
              </AuthProvider>
            </ThemeProvider>
          </SoundProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// to do : ajout de log securiser et chiffrer / de performance et d'erreurs / interface de monitoring server de log etc etc ...
// to do : gérer proprement pour la version web (plus compliquer que prévue)
// to do regler le probleme de la banniere offline qui ne passe pas en dessous du drawer et le toast qui s'affiche plus