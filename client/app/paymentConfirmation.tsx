import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './components/common/Button';
import { useTheme } from './constants/theme';

const PaymentConfirmation: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, spacing, borderRadius } = useTheme();

  // Parse les données des paramètres
  const products = params.products ? JSON.parse(params.products as string) : [];
  const totalPrice = params.totalPrice || '0.00';
  const success = params.success === 'true';

  // CORRECTION: Fonction pour retourner au Marketplace
  const handleBackToMarketplace = () => {
    // Utiliser le chemin de retour passé en paramètre ou le chemin par défaut
    const returnPath = params.returnPath || '/MarketplaceScreen';

    try {
      router.push(returnPath as string);
    } catch (error) {
      // Fallback si le chemin ne fonctionne pas
      console.error('Error navigating to marketplace:', error);
      router.push('/MarketplaceScreen');
    }
  };

  // CORRECTION: Fonction pour aller à l'accueil
  const handleGoHome = () => {
    try {
      router.push('/');
    } catch (error) {
      console.error('Error navigating to home:', error);
      router.replace('/');
    }
  };

  const styles = makeStyles({ colors, spacing, borderRadius });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Icône de succès */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={colors.success}
          />
        </View>

        {/* Titre et message principal */}
        <Text style={styles.title}>
          Paiement réussi !
        </Text>

        <Text style={styles.subtitle}>
          Votre achat a été confirmé avec succès
        </Text>

        {/* Détails de la commande */}
        <View style={styles.orderDetails}>
          <Text style={styles.sectionTitle}>Détails de votre achat</Text>

          {products.map((product: any, index: number) => (
            <View key={index} style={styles.productItem}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.sellerName}>Vendeur: {product.sellerName}</Text>
              </View>
              <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total payé:</Text>
            <Text style={styles.totalAmount}>€{totalPrice}</Text>
          </View>
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Vous pouvez retrouver cet achat dans votre historique des transactions.
          </Text>
        </View>

        {/* Message de remerciement */}
        <Text style={styles.thankYouText}>
          Merci pour votre achat ! 🎉
        </Text>

        {/* Boutons de navigation CORRIGÉS */}
        <View style={styles.buttonContainer}>
          <Button
            label="Retourner au Marketplace"
            onPress={handleBackToMarketplace}
            type="primary"
            icon="storefront-outline"
            style={styles.primaryButton}
          />

          <Button
            label="Accueil"
            onPress={handleGoHome}
            type="secondary"
            icon="home-outline"
            style={styles.secondaryButton}
          />
        </View>

        {/* Bouton alternatif si les boutons principaux ne fonctionnent pas */}
        <TouchableOpacity
          style={styles.fallbackButton}
          onPress={() => {
            try {
              router.back();
            } catch (error) {
              router.push('/');
            }
          }}
        >
          <Text style={styles.fallbackButtonText}>← Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = ({ colors, spacing, borderRadius }: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.backgroundText,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.backgroundTextSoft,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  orderDetails: {
    width: '100%',
    backgroundColor: colors.ui.card.background,
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ui.card.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.backgroundText,
    marginBottom: spacing.md,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.card.border,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.backgroundText,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 14,
    color: colors.backgroundTextSoft,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.backgroundText,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ui.card.background,
    padding: spacing.md,
    borderRadius: borderRadius.small,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.backgroundTextSoft,
  },
  thankYouText: {
    fontSize: 16,
    color: colors.backgroundText,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  fallbackButton: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  fallbackButtonText: {
    color: colors.backgroundTextSoft,
    fontSize: 14,
  },
});

export default PaymentConfirmation;