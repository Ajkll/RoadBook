import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Header from './components/layout/Header';
import SoundCardParameters from './components/parameters/soundCardParameters';
import { useTheme } from './constants/theme';
import GoBackHomeButton from './components/common/GoBackHomeButton';

export default function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <Header title="Paramètres" onMenuPress={openDrawer} />

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Paramètres</Text>

        {/* Carte des paramètres audio */}
        <SoundCardParameters />
        <GoBackHomeButton containerStyle={{ marginTop: theme.spacing.md }} />
        {/* Ajoutez d'autres sections de paramètres ici si nécessaire */}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.header.fontSize,
    fontWeight: theme.typography.header.fontWeight,
    color: theme.colors.backgroundText,
    marginBottom: theme.spacing.md,
  },
});

export default SettingsScreen;