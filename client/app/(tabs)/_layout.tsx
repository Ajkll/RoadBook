// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import BottomNavigation from '../components/ui/BottomNavigation';
import Header from '../components/layout/Header';

export default function TabsLayout() {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <Tabs
      screenOptions={{
        header: () => <Header title="RoadBook Tracker" onMenuPress={openDrawer} />,
        tabBarStyle: { display: 'none' }, // Cache la tab bar par défaut
      }}
      tabBar={(props) => <BottomNavigation {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="explorer" options={{ title: 'Explorer' }} />
      <Tabs.Screen name="start-drive" options={{ title: 'Démarrer' }} />
      <Tabs.Screen name="my-routes" options={{ title: 'Mes trajets' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen
        name="api-test"
        options={{
          title: 'API Test',
          headerShown: true, // Show header for this screen
        }}
      />
    </Tabs>
  );
}
