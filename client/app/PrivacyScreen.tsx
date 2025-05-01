import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Header from './components/layout/Header';
import BottomNavigation from './components/ui/BottomNavigation';
import { useTheme } from './constants/theme';

const PrivacyPolicyScreen = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <Header title="Politique de Confidentialité" />

      <ScrollView contentContainerStyle={[styles.scrollContainer, { padding: theme.spacing.lg }]}>
        <Text style={[styles.sectionTitle, {
          fontSize: theme.typography.title.fontSize,
          fontWeight: theme.typography.title.fontWeight,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          color: theme.colors.backgroundText
        }]}>
          1. Collecte des données
        </Text>
        <Text style={[styles.text, {
          fontSize: theme.typography.body.fontSize,
          lineHeight: theme.typography.body.fontSize * 1.5,
          color: theme.colors.backgroundTextSoft
        }]}>
          Nous recueillons certaines données pour améliorer l'expérience utilisateur, comme les
          préférences linguistiques ou les statistiques d'utilisation anonymes. Aucune information
          personnelle sensible n'est collectée sans votre consentement explicite.
        </Text>

        <Text style={[styles.sectionTitle, {
          fontSize: theme.typography.title.fontSize,
          fontWeight: theme.typography.title.fontWeight,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          color: theme.colors.backgroundText
        }]}>
          2. Utilisation des données
        </Text>
        <Text style={[styles.text, {
          fontSize: theme.typography.body.fontSize,
          lineHeight: theme.typography.body.fontSize * 1.5,
          color: theme.colors.backgroundTextSoft
        }]}>
          Les données collectées servent uniquement à améliorer les fonctionnalités de l'application
          et à assurer son bon fonctionnement. Elles ne sont jamais revendues ou partagées avec des
          tiers non autorisés.
        </Text>

        <Text style={[styles.sectionTitle, {
          fontSize: theme.typography.title.fontSize,
          fontWeight: theme.typography.title.fontWeight,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          color: theme.colors.backgroundText
        }]}>
          3. Stockage des données
        </Text>
        <Text style={[styles.text, {
          fontSize: theme.typography.body.fontSize,
          lineHeight: theme.typography.body.fontSize * 1.5,
          color: theme.colors.backgroundTextSoft
        }]}>
          Vos données sont stockées de manière sécurisée. Nous utilisons des protocoles de sécurité
          conformes aux standards de l'industrie pour éviter toute fuite ou accès non autorisé.
        </Text>

        <Text style={[styles.sectionTitle, {
          fontSize: theme.typography.title.fontSize,
          fontWeight: theme.typography.title.fontWeight,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          color: theme.colors.backgroundText
        }]}>
          4. Vos droits
        </Text>
        <Text style={[styles.text, {
          fontSize: theme.typography.body.fontSize,
          lineHeight: theme.typography.body.fontSize * 1.5,
          color: theme.colors.backgroundTextSoft
        }]}>
          Vous avez le droit de consulter, modifier ou supprimer vos données personnelles. Pour
          exercer ces droits, vous pouvez nous contacter via les paramètres de l'application.
        </Text>

        <Text style={[styles.sectionTitle, {
          fontSize: theme.typography.title.fontSize,
          fontWeight: theme.typography.title.fontWeight,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          color: theme.colors.backgroundText
        }]}>
          5. Contact
        </Text>
        <Text style={[styles.text, {
          fontSize: theme.typography.body.fontSize,
          lineHeight: theme.typography.body.fontSize * 1.5,
          color: theme.colors.backgroundTextSoft
        }]}>
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
  },
  scrollContainer: {
    flexGrow: 1,
  },
  sectionTitle: {
    // Les styles dynamiques sont appliqués directement dans le composant
  },
  text: {
    // Les styles dynamiques sont appliqués directement dans le composant
  },
});

export default PrivacyPolicyScreen;