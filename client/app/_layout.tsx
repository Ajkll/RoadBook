// client/app/_layout.tsx
import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Platform, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import CustomDrawerContent from './components/layout/CustomDrawerContent';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './constants/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Provider } from 'react-redux';
import store from './store/store';

// Composant qui décide quel navigateur afficher en fonction de l'état d'authentification
function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, dark } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Si l'utilisateur n'est pas connecté, montre le navigateur de connexion
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

  // Si l'utilisateur est connecté, montre le tiroir de navigation
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: Platform.OS === 'web' ? 'permanent' : 'front',
          drawerStyle: {
            backgroundColor: colors.background,
            width: 280,
          },
          overlayColor: 'rgba(0,0,0,0.5)',
          swipeEdgeWidth: 100,
          gestureEnabled: true,
        }}
      >
        {/* Main tabs */}
        <Drawer.Screen
          name="(tabs)"
          options={{
            title: 'RoadBook Tracker',
            drawerLabel: 'Accueil',
          }}
        />

        {/* Dashboard and primary screens */}
        <Drawer.Screen
          name="DashboardScreen"
          options={{
            title: 'Dashboard',
            drawerLabel: 'Dashboard',
          }}
        />
        <Drawer.Screen
          name="MyRoadbookScreen"
          options={{
            title: 'Mon Carnet',
            drawerLabel: 'Mon Carnet',
          }}
        />
        <Drawer.Screen
          name="MyRoutesScreen"
          options={{
            title: 'Mes trajets',
            drawerLabel: 'Mes trajets',
          }}
        />

        {/* Community features */}
        <Drawer.Screen
          name="CommunityScreen"
          options={{
            title: 'Communauté',
            drawerLabel: 'Communauté',
          }}
        />
        <Drawer.Screen
          name="MentorsScreen"
          options={{
            title: 'Mentors',
            drawerLabel: 'Mentors',
          }}
        />
        <Drawer.Screen
          name="SkillsScreen"
          options={{
            title: 'Compétences',
            drawerLabel: 'Compétences',
          }}
        />
        <Drawer.Screen
          name="MarketplaceScreen"
          options={{
            title: 'Marketplace',
            drawerLabel: 'Marketplace',
          }}
        />

        {/* Settings and help */}
        <Drawer.Screen
          name="SettingsScreen"
          options={{
            title: 'Paramètres',
            drawerLabel: 'Paramètres',
          }}
        />
        <Drawer.Screen
          name="PrivacyScreen"
          options={{
            title: 'Confidentialité',
            drawerLabel: 'Confidentialité',
          }}
        />
        <Drawer.Screen
          name="ShareScreen"
          options={{
            title: 'Partager',
            drawerLabel: 'Partager',
          }}
        />
        <Drawer.Screen
          name="HelpScreen"
          options={{
            title: 'Aide',
            drawerLabel: 'Aide',
          }}
        />
        <Drawer.Screen
          name="AboutUsScreen"
          options={{
            title: 'À propos de nous',
            drawerLabel: 'À propos de nous',
          }}
        />
        <Drawer.Screen
          name="StartDriveScreen"
          options={{
            title: 'Démarrer',
            drawerLabel: 'Démarrer',
          }}
        />
        <Drawer.Screen
          name="ProfileScreen"
          options={{
            title: 'Profil',
            drawerLabel: 'Profil',
          }}
        />
      </Drawer>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ThemeProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
