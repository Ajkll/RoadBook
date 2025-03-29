import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/theme';

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Normalise le pathname en retirant le "/" initial
  const normalizedPathname = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  // Renvoie true si le normalizedPathname correspond exactement à la route passée
  const isActive = (path: string) => {
    return normalizedPathname === path;
  };

  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/')}>
        <Ionicons
          name={isActive('') ? 'home' : 'home-outline'}
          size={24}
          color={isActive('') ? colors.activeItem : colors.tabBar}
        />
        <Text style={[styles.navText, { color: isActive('') ? colors.activeItem : colors.tabBar }]}>
          Accueil
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/explorer')}>
        <Ionicons
          name={isActive('explorer') ? 'search' : 'search-outline'}
          size={24}
          color={isActive('explorer') ? colors.activeItem : colors.tabBar}
        />
        <Text style={[styles.navText, { color: isActive('explorer') ? colors.activeItem : colors.tabBar }]}>
          Explorer
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.recordButton} onPress={() => router.push('/(tabs)/start-drive')}>
        <View style={[styles.recordIcon, { backgroundColor: colors.background, borderColor: isActive('start-drive') ? colors.activeItem : colors.tabBar }]}>
          <MaterialIcons
            name={isActive('start-drive') ? 'square' : 'circle'}
            size={isActive('start-drive') ? 30 : 40}
            color={isActive('start-drive') ? '#e57373' : colors.tabBar}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/my-routes')}>
        <Ionicons
          name={isActive('my-routes') ? 'map' : 'map-outline'}
          size={24}
          color={isActive('my-routes') ? colors.activeItem : colors.tabBar}
        />
        <Text style={[styles.navText, { color: isActive('my-routes') ? colors.activeItem : colors.tabBar }]}>
          Mes trajets
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/profile')}>
        <Ionicons
          name={isActive('profile') ? 'person' : 'person-outline'}
          size={24}
          color={isActive('profile') ? colors.activeItem : colors.tabBar}
        />
        <Text style={[styles.navText, { color: isActive('profile') ? colors.activeItem : colors.tabBar }]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: Platform.OS === 'ios' ? 80 : 60,
      borderTopWidth: 1,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingTop: 6,
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 1000,
      backgroundColor: colors.background,
      borderTopColor: colors.icon,
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
      marginTop: -20,
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
