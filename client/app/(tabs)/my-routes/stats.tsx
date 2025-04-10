import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useRouter, usePathname } from 'expo-router';

export default function MyRoutes() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const currentPath = usePathname();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 && currentPath.includes('stats')) {
          router.push('/(tabs)/my-routes/my-roads');
        } else if (gestureState.dx > 50 && currentPath.includes('my-roads')) {
          router.push('/(tabs)/my-routes/stats');
        }
      },
    })
  ).current;

  return <View style={styles.container} {...panResponder.panHandlers}></View>;
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingTop: 20,
    },
  });
