// app/_layout.tsx (complete)
import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CustomDrawerContent from './components/layout/CustomDrawerContent';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './constants/theme';

function DrawerNavigator() {
  const { colors, dark } = useTheme();

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
        <ThemeProvider>
          <DrawerNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
