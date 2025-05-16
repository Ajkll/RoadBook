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
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => <BottomNavigation {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="explorer" options={{ title: 'Explorer' }} />
      <Tabs.Screen name="my-routes" options={{ title: 'Mes trajets' }} />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          headerShown: false // Header est géré à l'intérieur du composant Profile
        }} 
      />
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
