// app/components/ui/BottomNavigation.tsx (complete)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/theme';

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Helper to check which tab is active
  const isActive = (path) => {
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
      ]}
    >
      {/* Home Tab */}
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/')}>
        <Ionicons
          name={isActive('/(tabs)/') ? 'home' : 'home-outline'}
          size={24}
          color={isActive('/(tabs)/') ? colors.primary : colors.tabBarInactive}
        />
        <Text
          style={[
            styles.navText,
            { color: isActive('/(tabs)/') ? colors.primary : colors.tabBarInactive },
          ]}
        >
          Accueil
        </Text>
      </TouchableOpacity>

      {/* Explorer Tab */}
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/explorer')}>
        <Ionicons
          name={isActive('/(tabs)/explorer') ? 'search' : 'search-outline'}
          size={24}
          color={isActive('/(tabs)/explorer') ? colors.primary : colors.tabBarInactive}
        />
        <Text
          style={[
            styles.navText,
            { color: isActive('/(tabs)/explorer') ? colors.primary : colors.tabBarInactive },
          ]}
        >
          Explorer
        </Text>
      </TouchableOpacity>

      {/* Record Button (Center) */}
      <TouchableOpacity
        style={styles.recordButton}
        onPress={() => router.push('/(tabs)/start-drive')}
      >
        <View
          style={[
            styles.recordIcon,
            {
              backgroundColor: colors.recordButton,
              borderColor: isActive('/(tabs)/start-drive')
                ? colors.primary
                : colors.recordButtonBorder,
            },
          ]}
        >
        <MaterialIcons
          name={isActive('/(tabs)/start-drive') ? 'square' : 'circle'}
          size={isActive('/(tabs)/start-drive') ? 30 : 40}
          color={isActive('/(tabs)/start-drive') ? "#e57373" : colors.tabBarInactive}
        />
        </View>
      </TouchableOpacity>

      {/* My Routes Tab */}
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/my-routes')}>
        <Ionicons
          name={isActive('/(tabs)/my-routes') ? 'map' : 'map-outline'}
          size={24}
          color={isActive('/(tabs)/my-routes') ? colors.primary : colors.tabBarInactive}
        />
        <Text
          style={[
            styles.navText,
            { color: isActive('/(tabs)/my-routes') ? colors.primary : colors.tabBarInactive },
          ]}
        >
          Mes trajets
        </Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/profile')}>
        <Ionicons
          name={isActive('/(tabs)/profile') ? 'person' : 'person-outline'}
          size={24}
          color={isActive('/(tabs)/profile') ? colors.primary : colors.tabBarInactive}
        />
        <Text
          style={[
            styles.navText,
            { color: isActive('/(tabs)/profile') ? colors.primary : colors.tabBarInactive },
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 80 : 60, // Taller on iOS to accommodate safe area
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 1000,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  recordButton: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20, // Raises the button above the bar
  },
  recordIcon: {
    width: 56,
    height: 56,
    padding: 0,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default BottomNavigation;
