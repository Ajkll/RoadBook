import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Header from './components/layout/Header';
import BottomNavigation from './components/ui/BottomNavigation';
import { useTheme } from './constants/theme';
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from './store/slices/networkSlice';
import OfflineContent from './components/ui/OfflineContent';

const ShareScreen = () => {
  const theme = useTheme();
  const isConnected = useSelector(selectIsInternetReachable);
  const message = encodeURIComponent('📲 Essaie cette super app ! Elle est top 👉 lien.exemple');

  const openURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("L'application n'est pas installée.");
    }
  };

  const shareToWhatsApp = () => openURL(`whatsapp://send?text=${message}`);
  const shareToMessenger = () => openURL(`fb-messenger://share?link=${message}`);
  const shareToEmail = () => openURL(`mailto:?subject=Découvre cette app&body=${message}`);
  const shareToReddit = () =>
    openURL(`https://www.reddit.com/submit?url=${message}&title=Découvre%20cette%20app`);

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <Header title="Partager l'application" />
        <OfflineContent message="Impossible de partager. Vérifiez votre connexion internet." />
        <BottomNavigation />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <Header title="Partager l'application" />

      <ScrollView contentContainerStyle={[styles.scrollContainer, { padding: theme.spacing.lg }]}>
        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: '#25D366',
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg
          }]}
          onPress={shareToWhatsApp}
        >
          <FontAwesome name="whatsapp" size={24} color="#fff" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#fff' }]}>Partager sur WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: '#0078FF',
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg
          }]}
          onPress={shareToMessenger}
        >
          <MaterialCommunityIcons
            name="facebook-messenger"
            size={24}
            color="#fff"
            style={styles.icon}
          />
          <Text style={[styles.buttonText, { color: '#fff' }]}>Partager sur Messenger</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: '#D44638',
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg
          }]}
          onPress={shareToEmail}
        >
          <Feather name="mail" size={24} color="#fff" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#fff' }]}>Partager par e-mail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: '#FF5700',
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg
          }]}
          onPress={shareToReddit}
        >
          <FontAwesome name="reddit-alien" size={24} color="#fff" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#fff' }]}>Partager sur Reddit</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    marginLeft: 12,
  },
  icon: {
    width: 24,
  },
});

export default ShareScreen;