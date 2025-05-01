import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import Header from './components/layout/Header';
import BottomNavigation from './components/ui/BottomNavigation';

const HelpScreen = () => {
  return (
    <View style={[styles.container]}>
      <StatusBar style="dark" />

      <Header title="Aide" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.question}>❓ Comment utiliser l'application ?</Text>
          <Text style={styles.answer}>
            Naviguez simplement via le menu principal pour accéder aux différentes fonctionnalités
            comme les paramètres, le partage, et les données principales. Chaque écran est conçu
            pour être intuitif et facile à utiliser.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.question}>🔔 Comment activer ou désactiver les notifications ?</Text>
          <Text style={styles.answer}>
            Allez dans l'onglet "Paramètres" et activez ou désactivez les notifications via
            l'interrupteur prévu.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.question}>🌗 Puis-je changer le thème en mode clair ou sombre ?</Text>
          <Text style={styles.answer}>
            Oui, rendez-vous dans les paramètres et sélectionnez le mode d'affichage qui vous
            convient.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.question}>📏 Comment changer l'unité de mesure (km ↔ miles) ?</Text>
          <Text style={styles.answer}>
            Dans les paramètres, vous pouvez choisir entre les kilomètres et les miles selon votre
            préférence.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.question}>📤 Comment partager l'application avec mes amis ?</Text>
          <Text style={styles.answer}>
            Accédez à l'écran de partage pour envoyer le lien via WhatsApp, Messenger, Instagram,
            e-mail ou Reddit.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.question}>📩 Besoin d'aide supplémentaire ?</Text>
          <Text style={styles.answer}>
            Vous pouvez nous contacter par e-mail à support@roadbook.com. Nous répondrons dans les
            plus brefs délais.
          </Text>
        </View>

        <View style={styles.footer}>
          <MaterialIcons name="contact-support" size={24} color="#555" />
          <Text style={styles.footerText}>Merci d'utiliser notre application 🙌</Text>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },
});

export default HelpScreen;
