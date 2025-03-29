import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface HeaderProps {
  title?: string;
  onMenuPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = 'RoadBook Tracker', onMenuPress }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleMenuPress = onMenuPress ?? (() => {
    navigation.dispatch(DrawerActions.openDrawer());
  });

  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
        <Ionicons name="menu" size={24} color={colors.secondaryText} />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {/* Placeholder pour équilibrer la disposition */}
      <View style={styles.rightPlaceholder} />
    </View>
  );
};

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    header: {
      backgroundColor: colors.background, 
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: insets.top,
      height: 60 + insets.top,
      // Ombre pour iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      // Ombre pour Android
      elevation: 10,
    } as ViewStyle,
    menuButton: {
      padding: 8,
    } as ViewStyle,
    title: {
      color: colors.secondaryText, 
      fontSize: 18,
      fontWeight: 'bold',
    } as TextStyle,
    rightPlaceholder: {
      width: 40,
    } as ViewStyle,
  });

export default Header;
