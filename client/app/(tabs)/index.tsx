import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Header from '../components/layout/Header';
import WeatherCard from '../components/ui/WeatherCard';
import ProgressBar from '../components/ui/ProgressBar';

export default function HomeScreen() {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <Header title="RoadBook Tracker" onMenuPress={openDrawer} />

      <ScrollView style={styles.content}>
        <Text style={styles.welcomeTitle}>Bienvenue</Text>

        {/* Weather Card */}
        <WeatherCard temperature={11} windSpeed={40} condition="pluvieux" visibility={3} />

        {/* Progress Bar */}
        <ProgressBar title="Progression" progress={67} />

        {/* Bottom spacer to prevent content from being hidden by navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333333',
  },
  content: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#bdbdbd',
    textAlign: 'center',
    marginVertical: 20,
  },
  bottomSpacer: {
    height: 70,
  },
});
