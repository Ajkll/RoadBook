import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Header from './components/layout/Header';
import BottomNavigation from './components/ui/BottomNavigation';

const ShareScreen = () => {
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Header title="Partager l'application" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={[styles.button, styles.whatsapp]} onPress={shareToWhatsApp}>
          <FontAwesome name="whatsapp" size={24} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Partager sur WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.messenger]} onPress={shareToMessenger}>
          <MaterialCommunityIcons
            name="facebook-messenger"
            size={24}
            color="#fff"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Partager sur Messenger</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.email]} onPress={shareToEmail}>
          <Feather name="mail" size={24} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Partager par e-mail</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.reddit]} onPress={shareToReddit}>
          <FontAwesome name="reddit-alien" size={24} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Partager sur Reddit</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  scrollContainer: {
    padding: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  icon: {
    width: 24,
  },
  whatsapp: {
    backgroundColor: '#25D366',
  },
  messenger: {
    backgroundColor: '#0078FF',
  },
  instagram: {
    backgroundColor: '#C13584',
  },
  email: {
    backgroundColor: '#D44638',
  },
  reddit: {
    backgroundColor: '#FF5700',
  },
});

export default ShareScreen;
