// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import BottomNavigation from '../components/ui/BottomNavigation';

export default function TabsLayout() {
  //const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Hide the default tab bar since we're using our custom one
        tabBarStyle: { display: 'none' },
      }}
      // Use our improved custom tab bar
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
