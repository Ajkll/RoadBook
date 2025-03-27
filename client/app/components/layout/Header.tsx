// app/components/layout/Header.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define prop types
interface HeaderProps {
  title?: string;
  onMenuPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = 'RoadBook Tracker', onMenuPress }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // Use default menu press handler if none provided
  const handleMenuPress =
    onMenuPress ??
    (() => {
      navigation.dispatch(DrawerActions.openDrawer());
    });

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
        <Ionicons name="menu" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {/* Empty view to balance layout symmetry */}
      <View style={styles.rightPlaceholder} />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  } as ViewStyle,
  menuButton: {
    padding: 8,
  } as ViewStyle,
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  } as TextStyle,
  rightPlaceholder: {
    width: 40, // Same size as menu button to center title
  } as ViewStyle,
});

export default Header;
