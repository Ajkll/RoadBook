// PaymentScreen.tsx - Corrections pour éviter les boucles infinies

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from './constants/theme';
import { useSound } from './hooks/useSound';
import GoBackHomeButton from './components/common/GoBackHomeButton';
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from './store/slices/networkSlice';
import Toast from 'react-native-toast-message';

import {
  purchaseItem,
  recordPurchase,
  MarketplaceItem
} from './services/firebase/marketplace';
import { authApi } from './services/api/auth.api';

const PaymentScreen: React.FC = () => {
  const theme = useTheme();
  const { play } = useSound();
  const isConnected = useSelector(selectIsInternetReachable);
  const router = useRouter();
  const params = useLocalSearchParams();

  // États pour le formulaire
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'google' | 'bancontact'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCVC] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cardNumberError, setCardNumberError] = useState('');
  const [expiryError, setExpiryError] = useState('');

  // États pour les données
  const [parsedProduct, setParsedProduct] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [initializationError, setInitializationError] = useState<string>('');
  const [effectiveItemId, setEffectiveItemId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // CORRECTION: Mémoriser les paramètres pour éviter les re-renders
  const memoizedParams = useMemo(() => ({
    itemId: params.itemId as string,
    backupItemId: params.backupItemId as string,
    product: params.product as string,
    sellerId: params.sellerId as string,
    sellerName: params.sellerName as string,
    itemTitle: params.itemTitle as string,
    itemPrice: params.itemPrice as string,
  }), [params.itemId, params.backupItemId, params.product, params.sellerId, params.sellerName, params.itemTitle, params.itemPrice]);

  // CORRECTION: Fonction d'initialisation mémorisée
  const initializeData = useCallback(() => {
    if (isInitialized) return; // Éviter de re-initialiser

    try {
      let itemId = '';

      if (memoizedParams.itemId && memoizedParams.itemId !== '') {
        itemId = memoizedParams.itemId;
      }

      if (!itemId && memoizedParams.backupItemId && memoizedParams.backupItemId !== '') {
        itemId = memoizedParams.backupItemId;
      }

      if (!itemId && memoizedParams.product) {
        try {
          const product = JSON.parse(memoizedParams.product);
          if (product.id && product.id !== '') {
            itemId = product.id;
          }
        } catch (e) {
          console.warn('Error parsing product:', e);
        }
      }

      if (!itemId) {
        setInitializationError('ID de l\'article introuvable. Impossible de procéder à l\'achat.');
        setIsInitialized(true);
        return;
      }

      setEffectiveItemId(itemId);

      if (!memoizedParams.product) {
        setInitializationError('Données de l\'article manquantes');
        setIsInitialized(true);
        return;
      }

      const product = JSON.parse(memoizedParams.product);
      product.id = itemId;

      if (!product.title || product.price === undefined || product.price === null) {
        setInitializationError('Informations de l\'article incomplètes');
        setIsInitialized(true);
        return;
      }

      if (!memoizedParams.sellerId) {
        setInitializationError('Informations du vendeur manquantes');
        setIsInitialized(true);
        return;
      }

      setParsedProduct(product);
      setInitializationError('');
      setIsInitialized(true);

    } catch (error) {
      setInitializationError('Erreur de chargement des données: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
      setIsInitialized(true);
    }
  }, [memoizedParams, isInitialized]);

  // CORRECTION: Charger l'utilisateur une seule fois
  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert(
        'Erreur d\'authentification',
        'Impossible de charger les informations utilisateur. Veuillez vous reconnecter.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    }
  }, [router]);

  // CORRECTION: Vérification du propriétaire mémorisée
  const checkOwnership = useCallback(() => {
    if (currentUser && memoizedParams.sellerId &&
        (currentUser.id === memoizedParams.sellerId || currentUser.uid === memoizedParams.sellerId)) {
      Alert.alert(
        'Achat impossible',
        'Vous ne pouvez pas acheter votre propre article.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    }
  }, [currentUser, memoizedParams.sellerId, router]);

  // Effects avec dépendances correctes
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (currentUser && isInitialized) {
      checkOwnership();
    }
  }, [currentUser, isInitialized, checkOwnership]);

  // CORRECTION: Fonctions de validation mémorisées
  const validateCardNumber = useCallback((value: string) => {
    const cardRegex = /^\d{16}$/;
    if (!cardRegex.test(value)) {
      setCardNumberError('Le numéro de carte doit contenir exactement 16 chiffres.');
    } else {
      setCardNumberError('');
    }
  }, []);

  const validateExpiry = useCallback((value: string) => {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(value)) {
      setExpiryError("Le format de la date d'expiration doit être MM/YY");
    } else {
      setExpiryError('');
    }
  }, []);

  const validateCVC = useCallback((value: string) => {
    const cvcRegex = /^\d{3}$/;
    if (!cvcRegex.test(value)) {
      setErrorMessage('Le CVC doit contenir exactement 3 chiffres.');
    } else {
      setErrorMessage('');
    }
  }, []);

  // CORRECTION: Simulation de paiement mémorisée
  const simulatePaymentProcessing = useCallback(async (
    method: string,
    details: { cardNumber?: string; expiry?: string; cvc?: string }
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (method === 'card' && details.cardNumber === '4000000000000002') {
          reject(new Error('Carte refusée'));
          return;
        }

        if (method === 'card' && details.cardNumber === '4000000000000119') {
          reject(new Error('Fonds insuffisants'));
          return;
        }

        resolve();
      }, 2000);
    });
  }, []);

  // CORRECTION: Fonction de paiement avec gestion d'état appropriée
  const handlePayment = useCallback(async () => {
    if (!currentUser) {
      play('ERROR_SOUND');
      setErrorMessage('Utilisateur non connecté');
      return;
    }

    if (!effectiveItemId || effectiveItemId === '') {
      play('ERROR_SOUND');
      setErrorMessage('ID de l\'article manquant');
      return;
    }

    if (!isConnected) {
      play('ERROR_SOUND');
      setErrorMessage('Aucune connexion Internet disponible');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setCardNumberError('');
    setExpiryError('');

    if (paymentMethod === 'card') {
      if (!cardNumber || !expiry || !cvc) {
        play('ERROR_SOUND');
        setErrorMessage('Veuillez remplir tous les champs de votre carte');
        setIsLoading(false);
        return;
      }

      if (!/^\d{16}$/.test(cardNumber)) {
        play('WARNING_SOUND');
        setCardNumberError('Le numéro de carte doit contenir exactement 16 chiffres.');
        setIsLoading(false);
        return;
      }

      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(expiry)) {
        play('WARNING_SOUND');
        setExpiryError("Le format de la date d'expiration doit être MM/YY");
        setIsLoading(false);
        return;
      }

      if (!/^\d{3}$/.test(cvc)) {
        play('WARNING_SOUND');
        setErrorMessage('Le CVC doit contenir exactement 3 chiffres.');
        setIsLoading(false);
        return;
      }
    }

    try {
      await simulatePaymentProcessing(paymentMethod, { cardNumber, expiry, cvc });

      const userId = currentUser.id || currentUser.uid;
      const userName = currentUser.displayName || currentUser.name || currentUser.email || 'Acheteur anonyme';

      await purchaseItem(effectiveItemId, userId, userName);
      await recordPurchase(effectiveItemId, userId, userName);

      play('SUCCESS_SOUND');

      Toast.show({
        type: 'success',
        text1: 'Achat réussi',
        text2: `Vous avez acheté "${parsedProduct.title}"`,
        position: 'bottom'
      });

      const products = [{
        id: effectiveItemId,
        name: parsedProduct.title,
        price: parsedProduct.price,
        sellerId: memoizedParams.sellerId,
        sellerName: parsedProduct.sellerName
      }];

      // Navigation vers la confirmation
      router.push({
        pathname: '/paymentConfirmation',
        params: {
          products: JSON.stringify(products),
          totalPrice: parsedProduct.price.toFixed(2),
          sellerId: memoizedParams.sellerId,
          itemId: effectiveItemId,
          success: 'true',
          returnPath: '/MarketplaceScreen'
        },
      });

    } catch (error) {
      play('ERROR_SOUND');

      let errorMsg = 'Une erreur est survenue lors du paiement';

      if (error instanceof Error) {
        if (error.message.includes("n'existe pas")) {
          errorMsg = 'Article non trouvé ou supprimé';
        } else if (error.message.includes('déjà été vendu')) {
          errorMsg = 'Cet article a déjà été vendu';
        } else if (error.message.includes('votre propre article')) {
          errorMsg = 'Vous ne pouvez pas acheter votre propre article';
        } else if (error.message.includes('Carte refusée')) {
          errorMsg = 'Votre carte a été refusée';
        } else if (error.message.includes('Fonds insuffisants')) {
          errorMsg = 'Fonds insuffisants sur votre carte';
        } else if (error.message.includes('supprimé')) {
          errorMsg = 'Cet article a été retiré de la vente';
        } else {
          errorMsg = error.message;
        }
      }

      setErrorMessage(errorMsg);

      Toast.show({
        type: 'error',
        text1: 'Erreur de paiement',
        text2: errorMsg,
        position: 'bottom'
      });

    } finally {
      setIsLoading(false);
    }
  }, [
    currentUser,
    effectiveItemId,
    isConnected,
    paymentMethod,
    cardNumber,
    expiry,
    cvc,
    play,
    simulatePaymentProcessing,
    parsedProduct,
    memoizedParams.sellerId,
    router
  ]);

  // CORRECTION: Handlers mémorisés pour éviter les re-renders
  const handleCardNumberChange = useCallback((text: string) => {
    setCardNumber(text);
  }, []);

  const handleExpiryChange = useCallback((text: string) => {
    setExpiry(text);
  }, []);

  const handleCVCChange = useCallback((text: string) => {
    setCVC(text);
  }, []);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Rendu conditionnel sans re-render
  if (initializationError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Article non trouvé</Text>
          <Text style={styles.errorMessage}>{initializationError}</Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser || !parsedProduct || !isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const products = [{
    id: effectiveItemId,
    name: parsedProduct.title,
    price: parsedProduct.price,
    sellerId: memoizedParams.sellerId,
    sellerName: parsedProduct.sellerName
  }];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Paiement</Text>

        <View style={styles.itemInfo}>
          <Text style={styles.itemLabel}>Article à acheter:</Text>
          <Text style={styles.itemTitle}>{parsedProduct.title}</Text>
          <Text style={styles.itemSeller}>
            Vendeur: {parsedProduct.sellerName}
          </Text>
          <Text style={styles.itemPrice}>
            Prix: €{parsedProduct.price.toFixed(2)}
          </Text>
          {parsedProduct.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {parsedProduct.description}
            </Text>
          )}
        </View>

        <View style={styles.summary}>
          <Text style={styles.label}>Résumé de la commande:</Text>
          {products.map((product, index) => (
            <View key={index} style={styles.productContainer}>
              <Text style={[styles.value, styles.productName]}>{product.name}</Text>
              <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total à payer:</Text>
            <Text style={styles.totalValue}>
              €{products.reduce((acc, product) => acc + product.price, 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Méthode de paiement</Text>

        <View style={styles.methodContainer}>
          <TouchableOpacity
            style={[styles.methodButton, paymentMethod === 'card' && styles.methodSelected]}
            onPress={() => setPaymentMethod('card')}
          >
            <Text style={[styles.methodText, paymentMethod === 'card' && styles.methodSelectedText]}>
              💳 Carte
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, paymentMethod === 'paypal' && styles.methodSelected]}
            onPress={() => setPaymentMethod('paypal')}
          >
            <Text style={[styles.methodText, paymentMethod === 'paypal' && styles.methodSelectedText]}>
              🅿️ PayPal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, paymentMethod === 'google' && styles.methodSelected]}
            onPress={() => setPaymentMethod('google')}
          >
            <Text style={[styles.methodText, paymentMethod === 'google' && styles.methodSelectedText]}>
              📱 Google Pay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, paymentMethod === 'bancontact' && styles.methodSelected]}
            onPress={() => setPaymentMethod('bancontact')}
          >
            <Text style={[styles.methodText, paymentMethod === 'bancontact' && styles.methodSelectedText]}>
              🇧🇪 Bancontact
            </Text>
          </TouchableOpacity>
        </View>

        {paymentMethod === 'card' && (
          <>
            <Text style={styles.sectionTitle}>Détails de la carte</Text>
            <TextInput
              style={styles.input}
              placeholder="Numéro de carte (ex: 4111111111111111)"
              placeholderTextColor={theme.colors.backgroundTextSoft}
              keyboardType="numeric"
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              onBlur={() => validateCardNumber(cardNumber)}
            />
            {cardNumberError ? (
              <Text style={styles.errorText}>{cardNumberError}</Text>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Expire (MM/YY)"
              placeholderTextColor={theme.colors.backgroundTextSoft}
              value={expiry}
              onChangeText={handleExpiryChange}
              onBlur={() => validateExpiry(expiry)}
            />
            {expiryError ? (
              <Text style={styles.errorText}>{expiryError}</Text>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="CVC"
              placeholderTextColor={theme.colors.backgroundTextSoft}
              keyboardType="numeric"
              value={cvc}
              onChangeText={handleCVCChange}
              onBlur={() => validateCVC(cvc)}
            />
          </>
        )}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              {paymentMethod === 'card'
                ? 'Traitement du paiement...'
                : 'Redirection vers le fournisseur de paiement...'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {paymentMethod === 'card'
              ? `Payer €${parsedProduct.price.toFixed(2)} par Carte`
              : paymentMethod === 'paypal'
              ? 'Continuer avec PayPal'
              : paymentMethod === 'google'
              ? 'Continuer avec Google Pay'
              : 'Continuer avec Bancontact'}
          </Text>
        </TouchableOpacity>

        <GoBackHomeButton
          containerStyle={{
            marginBottom: theme.spacing.md,
            marginTop: theme.spacing.xxl,
            alignSelf: 'flex-start'
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles inchangés mais mémorisés
const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.SuperTitle.fontSize,
    fontWeight: theme.typography.SuperTitle.fontWeight,
    marginBottom: theme.spacing.lg,
    color: theme.colors.backgroundText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.backgroundText,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.backgroundTextSoft,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.backgroundTextSoft,
  },
  itemInfo: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.ui.card.background,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  itemLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.backgroundTextSoft,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.backgroundText,
    marginBottom: theme.spacing.xs,
  },
  itemSeller: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.backgroundTextSoft,
    marginBottom: theme.spacing.xs,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  itemDescription: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.backgroundTextSoft,
    fontStyle: 'italic',
    marginBottom: theme.spacing.xs,
  },
  summary: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.ui.card.background,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.ui.card.border,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.backgroundTextSoft,
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    marginBottom: theme.spacing.sm,
    color: theme.colors.backgroundText,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  totalLabel: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: 'bold',
    color: theme.colors.backgroundText,
  },
  totalValue: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    marginBottom: theme.spacing.md,
    color: theme.colors.backgroundText,
  },
  methodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  methodButton: {
    flexBasis: '48%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  methodSelected: {
    backgroundColor: theme.colors.primary,
  },
  methodText: {
    color: theme.colors.secondaryText,
    fontWeight: theme.typography.button.fontWeight,
  },
  methodSelectedText: {
    color: theme.colors.primaryText,
  },
  input: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    borderColor: theme.colors.border,
    borderWidth: 1,
    color: theme.colors.backgroundText,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadow.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.primaryText,
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: theme.spacing.sm,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  productContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  productName: {
    flex: 2,
    fontSize: theme.typography.body.fontSize,
  },
  productPrice: {
    textAlign: 'right',
    flex: 1,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.backgroundText,
    fontWeight: '600',
  },
});

export default PaymentScreen;