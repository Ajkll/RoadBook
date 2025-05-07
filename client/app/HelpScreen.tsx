import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import Header from './components/layout/Header';
import { useTheme } from './constants/theme';
import { CopyToClipboard } from './components/common/ClipBoardCopy';
import GoBackHomeButton from './components/common/GoBackHomeButton';
import { useRouter } from 'expo-router';

const HelpScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const styles = makeStyles(theme);

  const handlePrivacyPolicy = () => {
    router.push('/PrivacyScreen');
  };

  const handleSharePress = () => {
    router.push('/ShareScreen');
  };

  return (
    <View style={styles.container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <Header title="Aide" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        <View style={styles.section}>
          <View style={styles.questionContainer}>
            <MaterialIcons name="help-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.question}>Comment utiliser l'application ?</Text>
          </View>
          <Text style={styles.answer}>
            Naviguez simplement via le menu principal pour accéder aux différentes fonctionnalités
            comme les paramètres, le partage, et les données principales. Chaque écran est conçu
            pour être intuitif et facile à utiliser.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.questionContainer}>
            <MaterialIcons name="notifications" size={20} color={theme.colors.primary} />
            <Text style={styles.question}>Comment activer ou désactiver les notifications ?</Text>
          </View>
          <Text style={styles.answer}>
            Allez dans l'onglet "Paramètres" et activez ou désactivez les notifications via
            l'interrupteur prévu.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.questionContainer}>
            <MaterialIcons name="brightness-6" size={20} color={theme.colors.primary} />
            <Text style={styles.question}>Puis-je changer le thème en mode clair ou sombre ?</Text>
          </View>
          <Text style={styles.answer}>
            Oui, rendez-vous dans les paramètres et sélectionnez le mode d'affichage qui vous
            convient.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.questionContainer}>
            <MaterialIcons name="straighten" size={20} color={theme.colors.primary} />
            <Text style={styles.question}>Comment changer l'unité de mesure (km ↔ miles) ?</Text>
          </View>
          <Text style={styles.answer}>
            Dans les paramètres, vous pouvez choisir entre les kilomètres et les miles selon votre
            préférence.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.questionContainer}>
            <MaterialIcons name="share" size={20} color={theme.colors.primary} />
            <Text style={styles.question}>Comment partager l'application avec mes amis ?</Text>
          </View>
          <Text style={styles.answer}>
            Utilisez le bouton ci-dessous pour accéder à l'écran de partage et envoyer le lien via vos applications préférées.
          </Text>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSharePress}
          >
            <MaterialIcons name="share" size={20} color="white" />
            <Text style={styles.shareButtonText}>Ouvrir l'écran de partage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.questionContainer}>
            <MaterialIcons name="contact-support" size={20} color={theme.colors.primary} />
            <Text style={styles.question}>Besoin d'aide supplémentaire ?</Text>
          </View>
          <Text style={styles.answer}>
            Vous pouvez nous contacter par e-mail à HE2023@students.ephec.be. Nous répondrons dans les
            plus brefs délais.
          </Text>
        </View>

        <View style={styles.githubSection}>
          <Text style={styles.githubText}>Notre code source est ouvert :</Text>
          <CopyToClipboard
            text="https://github.com/Yanstart/RoadBook"
            displayText="github.com/Yanstart/RoadBook"
            showText={true}
            iconSize={18}
          />
        </View>

        <View style={styles.footer}>
          <MaterialIcons name="favorite" size={24} color={theme.colors.primary} />
          <Text style={styles.footerText}>Merci d'utiliser notre application</Text>
        </View>

        <TouchableOpacity
          style={styles.privacySection}
          onPress={handlePrivacyPolicy}
        >
          <MaterialIcons name="policy" size={18} color={theme.colors.primary} />
          <Text style={styles.privacyText}>Politique de confidentialité</Text>
        </TouchableOpacity>
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
    padding: theme.spacing.md,
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
  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: 8,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  question: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    marginLeft: theme.spacing.sm,
    color: theme.colors.backgroundText,
  },
  answer: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: 22,
    color: theme.colors.backgroundTextSoft,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  githubSection: {
    marginTop: theme.spacing.xs,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
  githubText: {
    fontSize: theme.typography.title.fontSize,
    color: theme.colors.backgroundText,
    marginBottom: theme.spacing.sm,
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    marginTop: theme.spacing.lg,
  },
  privacyText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  footer: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  footerText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.title.fontSize,
    color: theme.colors.backgroundText,
  },
});

export default HelpScreen;