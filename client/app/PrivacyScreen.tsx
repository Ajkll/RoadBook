import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import Header from './components/layout/Header';
import GoBackHomeButton from './components/common/GoBackHomeButton';
import { useTheme } from './constants/theme';

const PrivacyPolicyScreen = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <Header title="Politique de Confidentialité" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        <Text style={styles.sectionTitle}>
          1. Collecte des données
        </Text>
        <Text style={styles.text}>
          Nous recueillons certaines données pour améliorer l'expérience utilisateur, comme les
          préférences linguistiques ou les statistiques d'utilisation anonymes. Aucune information
          personnelle sensible n'est collectée sans votre consentement explicite.
        </Text>

        <Text style={styles.sectionTitle}>
          2. Utilisation des données
        </Text>
        <Text style={styles.text}>
          Les données collectées servent uniquement à améliorer les fonctionnalités de l'application
          et à assurer son bon fonctionnement. Elles ne sont jamais revendues ou partagées avec des
          tiers non autorisés.
        </Text>

        <Text style={styles.sectionTitle}>
          3. Stockage des données
        </Text>
        <Text style={styles.text}>
          Vos données sont stockées de manière sécurisée. Nous utilisons des protocoles de sécurité
          conformes aux standards de l'industrie pour éviter toute fuite ou accès non autorisé.
        </Text>

        <Text style={styles.sectionTitle}>
          4. Vos droits
        </Text>
        <Text style={styles.text}>
          Vous avez le droit de consulter, modifier ou supprimer vos données personnelles. Pour
          exercer ces droits, vous pouvez nous contacter via les paramètres de l'application.
        </Text>

        <Text style={styles.sectionTitle}>
          5. Contact
        </Text>
        <Text style={styles.text}>
          Pour toute question concernant cette politique de confidentialité, veuillez nous contacter
          à : HE2023@students.ephec.be
        </Text>
      </ScrollView>

      {/* Zone fixe en bas */}
      <View style={styles.fixedBottomContainer}>
        <GoBackHomeButton />
      </View>
    </View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    marginBottom: 60, // Espace pour la zone fixe du bas
  },
  scrollContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 20,
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.backgroundText
  },
  text: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.fontSize * 1.5,
    color: theme.colors.backgroundTextSoft,
    marginBottom: theme.spacing.md,
  },
});

export default PrivacyPolicyScreen;