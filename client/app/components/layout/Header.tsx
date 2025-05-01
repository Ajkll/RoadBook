import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, getShadowStyle } from '../../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface HeaderProps {
  title?: string;
  onMenuPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = 'RoadBook Tracker', onMenuPress }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleMenuPress =
    onMenuPress ??
    (() => {
      navigation.dispatch(DrawerActions.openDrawer());
    });

  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
        <Ionicons name="menu" size={24} color={theme.colors.backgroundIcon} />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {/* Placeholder pour équilibrer la disposition */}
      <View style={styles.rightPlaceholder} />
    </View>
  );
};

const createStyles = (theme, insets) =>
  StyleSheet.create({
    header: {
      backgroundColor: theme.colors.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingTop: insets.top,
      height: 60 + insets.top,
      ...getShadowStyle(theme),
    },
    menuButton: {
      padding: theme.spacing.sm,
    },
    title: {
      color: theme.colors.backgroundText,
      fontSize: theme.typography.title.fontSize,
      fontWeight: theme.typography.title.fontWeight,
    },
    rightPlaceholder: {
      width: 40,
    },
  });

export default Header;
