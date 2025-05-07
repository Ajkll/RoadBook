import React, { useMemo } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';

export default function MyRoutesLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const styles = useMemo(() => createStyles(), [colors]);

  const isStatsActive = pathname.includes('stats');
  const isMyRoadsActive = pathname.includes('my-roads');

  return (
    <View style={{ flex: 1 }}>
      {/* Stack Navigation avec animation */}
      <Stack>
        <Stack.Screen name="stats" options={{ headerShown: false, animation: 'slide_from_left' }} />
        <Stack.Screen
          name="my-roads"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>

      {/* Navigation persistante en bas */}
      <View style={styles.navigation}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/my-routes/stats')}>
          <FontAwesome
            name={isStatsActive ? 'circle' : 'circle-o'}
            size={isStatsActive ? 20 : 15}
            color={colors.primaryIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(tabs)/my-routes/my-roads')}>
          <FontAwesome
            name={isMyRoadsActive ? 'circle' : 'circle-o'}
            size={isStatsActive ? 15 : 20}
            color={colors.primaryIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    navigation: {
      position: 'absolute',
      bottom: 90,
      width: '8%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'center',
    },
  });
