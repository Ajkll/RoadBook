import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Header from './components/layout/Header';
import BottomNavigation from './components/ui/BottomNavigation';

const PrivacyPolicyScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Header title="Politique de Confidentialité" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>1. Collecte des données</Text>
        <Text style={styles.text}>
          Nous recueillons certaines données pour améliorer l'expérience utilisateur, comme les
          préférences linguistiques ou les statistiques d'utilisation anonymes. Aucune information
          personnelle sensible n'est collectée sans votre consentement explicite.
        </Text>

        <Text style={styles.sectionTitle}>2. Utilisation des données</Text>
        <Text style={styles.text}>
          Les données collectées servent uniquement à améliorer les fonctionnalités de l'application
          et à assurer son bon fonctionnement. Elles ne sont jamais revendues ou partagées avec des
          tiers non autorisés.
        </Text>

        <Text style={styles.sectionTitle}>3. Stockage des données</Text>
        <Text style={styles.text}>
          Vos données sont stockées de manière sécurisée. Nous utilisons des protocoles de sécurité
          conformes aux standards de l'industrie pour éviter toute fuite ou accès non autorisé.
        </Text>

        <Text style={styles.sectionTitle}>4. Vos droits</Text>
        <Text style={styles.text}>
          Vous avez le droit de consulter, modifier ou supprimer vos données personnelles. Pour
          exercer ces droits, vous pouvez nous contacter via les paramètres de l'application.
        </Text>

        <Text style={styles.sectionTitle}>5. Contact</Text>
        <Text style={styles.text}>
          Pour toute question concernant cette politique de confidentialité, veuillez nous contacter
          à : contact@roadbook.com
        </Text>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
});

export default PrivacyPolicyScreen;
