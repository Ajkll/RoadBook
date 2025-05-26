import React, { useState, useEffect } from 'react';
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

// Import des services marketplace
import {
  purchaseItem,
  recordPurchase,
  MarketplaceItem
} from './services/firebase/marketplace';
import { authApi } from './services/api/auth.api';

const PaymentScreen: React.FC = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { play } = useSound();
  const isConnected = useSelector(selectIsInternetReachable);
  const router = useRouter();
  const params = useLocalSearchParams();

  // États pour le paiement
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

  // Debug des paramètres reçus
  useEffect(() => {
    console.log('🔍 PaymentScreen - Tous les paramètres reçus:');
    console.log('📦 product:', params.product);
    console.log('🏪 sellerId:', params.sellerId);
    console.log('🏷️ itemId:', params.itemId);
    console.log('🔄 backupItemId:', params.backupItemId);
    console.log('📋 Tous les params:', JSON.stringify(params, null, 2));
  }, [params]);

  // Initialisation avec fallbacks multiples pour l'ID
  useEffect(() => {
    const initializeWithFallback = () => {
      try {
        console.log('🚀 Initialisation avec fallbacks...');

        // === ÉTAPE 1: Récupérer l'itemId avec tous les fallbacks possibles ===
        let itemId = '';

        // Tentative 1: itemId direct
        if (params.itemId && params.itemId !== '') {
          itemId = params.itemId as string;
          console.log('✅ ItemId trouvé dans params.itemId:', itemId);
        }

        // Tentative 2: backupItemId
        if (!itemId && params.backupItemId && params.backupItemId !== '') {
          itemId = params.backupItemId as string;
          console.log('🔄 ItemId trouvé dans backupItemId:', itemId);
        }

        // Tentative 3: Extraire depuis le JSON product
        if (!itemId && params.product) {
          try {
            const product = JSON.parse(params.product as string);
            if (product.id && product.id !== '') {
              itemId = product.id;
              console.log('📦 ItemId trouvé dans product.id:', itemId);
            }
          } catch (e) {
            console.warn('⚠️ Impossible de parser le product pour récupérer l\'ID');
          }
        }

        // Tentative 4: Générer un ID temporaire si tout échoue (dernière option)
        if (!itemId) {
          console.error('❌ Aucun itemId trouvé, génération d\'un ID temporaire');
          setInitializationError('ID de l\'article introuvable. Impossible de procéder à l\'achat.');
          return;
        }

        console.log('🎯 ItemId final retenu:', itemId);
        setEffectiveItemId(itemId);

        // === ÉTAPE 2: Parser et valider le produit ===
        if (!params.product) {
          console.error('❌ Paramètre product manquant');
          setInitializationError('Données de l\'article manquantes');
          return;
        }

        const product = JSON.parse(params.product as string);
        console.log('📦 Produit parsé:', product);

        // S'assurer que le produit a l'ID correct
        product.id = itemId;

        // Vérifier les données essentielles du produit
        if (!product.title || product.price === undefined || product.price === null) {
          console.error('❌ Données produit incomplètes:', product);
          setInitializationError('Informations de l\'article incomplètes');
          return;
        }

        if (!params.sellerId) {
          console.error('❌ SellerId manquant');
          setInitializationError('Informations du vendeur manquantes');
          return;
        }

        setParsedProduct(product);
        setInitializationError('');
        console.log('✅ Initialisation réussie');

      } catch (error) {
        console.error('❌ Erreur d\'initialisation:', error);
        setInitializationError('Erreur de chargement des données: ' + (error.message || 'Erreur inconnue'));
      }
    };

    initializeWithFallback();
  }, [params]);

  // Charger l'utilisateur actuel
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setCurrentUser(user);
        console.log('👤 Utilisateur chargé:', user?.id || user?.uid);
      } catch (error) {
        console.error('❌ Erreur chargement utilisateur:', error);
        Alert.alert(
          'Erreur d\'authentification',
          'Impossible de charger les informations utilisateur. Veuillez vous reconnecter.',
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      }
    };

    loadCurrentUser();
  }, []);

  // Vérification que l'utilisateur ne peut pas acheter son propre article
  useEffect(() => {
    if (currentUser && params.sellerId && (currentUser.id === params.sellerId || currentUser.uid === params.sellerId)) {
      Alert.alert(
        'Achat impossible',
        'Vous ne pouvez pas acheter votre propre article.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    }
  }, [currentUser, params.sellerId]);

  const validateCardNumber = (value: string) => {
    const cardRegex = /^\d{16}$/;
    if (!cardRegex.test(value)) {
      setCardNumberError('Le numéro de carte doit contenir exactement 16 chiffres.');
    } else {
      setCardNumberError('');
    }
  };

  const validateExpiry = (value: string) => {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(value)) {
      setExpiryError("Le format de la date d'expiration doit être MM/YY");
    } else {
      setExpiryError('');
    }
  };

  const validateCVC = (value: string) => {
    const cvcRegex = /^\d{3}$/;
    if (!cvcRegex.test(value)) {
      setErrorMessage('Le CVC doit contenir exactement 3 chiffres.');
    } else {
      setErrorMessage('');
    }
  };

  // Simulation du traitement de paiement
  const simulatePaymentProcessing = async (
    method: string,
    details: { cardNumber?: string; expiry?: string; cvc?: string }
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simuler différents cas d'échec pour les tests
        if (method === 'card' && details.cardNumber === '4000000000000002') {
          reject(new Error('Carte refusée'));
          return;
        }

        if (method === 'card' && details.cardNumber === '4000000000000119') {
          reject(new Error('Fonds insuffisants'));
          return;
        }

        // Succès par défaut
        resolve();
      }, 2000);
    });
  };

  const handlePayment = async () => {
    console.log('💳 Début du processus de paiement...');

    // Vérifications préliminaires
    if (!currentUser) {
      play('ERROR_SOUND');
      setErrorMessage('Utilisateur non connecté');
      return;
    }

    if (!effectiveItemId || effectiveItemId === '') {
      play('ERROR_SOUND');
      setErrorMessage('ID de l\'article manquant');
      console.error('❌ effectiveItemId manquant:', effectiveItemId);
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

    // Validation des champs de paiement
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
      console.log('🔄 Traitement du paiement...');

      // 1. Simuler le traitement du paiement
      await simulatePaymentProcessing(paymentMethod, { cardNumber, expiry, cvc });

      // 2. Traiter l'achat dans le marketplace
      const userId = currentUser.id || currentUser.uid;
      const userName = currentUser.displayName || currentUser.name || currentUser.email || 'Acheteur anonyme';

      console.log('🛒 Traitement de l\'achat marketplace:', {
        itemId: effectiveItemId,
        userId,
        userName,
        sellerId: params.sellerId
      });

      // Marquer l'article comme vendu et créer la transaction
      await purchaseItem(effectiveItemId, userId);

      // Enregistrer l'achat
      await recordPurchase(effectiveItemId, userId, userName);

      console.log('✅ Achat marketplace terminé avec succès');

      play('SUCCESS_SOUND');

      Toast.show({
        type: 'success',
        text1: 'Achat réussi',
        text2: `Vous avez acheté "${parsedProduct.title}"`,
        position: 'bottom'
      });

      // Préparer les données pour la confirmation
      const products = [{
        id: effectiveItemId,
        name: parsedProduct.title,
        price: parsedProduct.price,
        sellerId: params.sellerId,
        sellerName: parsedProduct.sellerName
      }];

      // Redirection vers la confirmation
      router.push({
        pathname: '/paymentConfirmation',
        params: {
          products: JSON.stringify(products),
          totalPrice: parsedProduct.price.toFixed(2),
          sellerId: params.sellerId,
          itemId: effectiveItemId
        },
      });

    } catch (error) {
      console.error('❌ Erreur paiement/achat:', error);
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
  };

  // Écran d'erreur si les données sont manquantes
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

          {/* Debug info en mode développement */}
          {__DEV__ && (
            <ScrollView style={styles.debugInfo}>
              <Text style={styles.debugTitle}>🔍 Informations de debug:</Text>
              <Text style={styles.debugText}>
                Params reçus: {JSON.stringify(params, null, 2)}
              </Text>
              <Text style={styles.debugText}>
                EffectiveItemId: {effectiveItemId || 'VIDE'}
              </Text>
              <Text style={styles.debugText}>
                ParsedProduct: {parsedProduct ? JSON.stringify(parsedProduct, null, 2) : 'NULL'}
              </Text>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Écran de chargement si l'utilisateur ou le produit ne sont pas encore chargés
  if (!currentUser || !parsedProduct) {
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
    sellerId: params.sellerId,
    sellerName: parsedProduct.sellerName
  }];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Paiement</Text>

        {/* Informations sur l'article */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemLabel}>Article à acheter:</Text>
          <Text style={styles.itemTitle}>{parsedProduct.title}</Text>
          <Text style={styles.itemSeller}>Vendeur: {parsedProduct.sellerName}</Text>
          {__DEV__ && (
            <Text style={styles.itemDebug}>ID: {effectiveItemId}</Text>
          )}
        </View>

        <View style={styles.summary}>
          <Text style={styles.label}>Résumé de la commande:</Text>
          {products.map((product, index) => (
            <View key={index} style={styles.productContainer}>
              <Text style={[styles.value, styles.productName]}>{product.name}</Text>
              <Text style={styles.productPrice}>{product.price.toFixed(2)}€</Text>
            </View>
          ))}

          <Text style={styles.label}>Total à payer:</Text>
          <Text style={styles.value}>
            {products.reduce((acc, product) => acc + product.price, 0).toFixed(2)}€
          </Text>
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
              onChangeText={setCardNumber}
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
              onChangeText={setExpiry}
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
              onChangeText={setCVC}
              onBlur={() => validateCVC(cvc)}
            />

            {/* Informations de test */}
            {__DEV__ && (
              <View style={styles.testInfo}>
                <Text style={styles.testInfoTitle}>🧪 Cartes de test:</Text>
                <Text style={styles.testInfoText}>• 4111111111111111 - Succès</Text>
                <Text style={styles.testInfoText}>• 4000000000000002 - Carte refusée</Text>
                <Text style={styles.testInfoText}>• 4000000000000119 - Fonds insuffisants</Text>
              </View>
            )}
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
              ? `Payer ${parsedProduct.price.toFixed(2)}€ par Carte`
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
  // Styles pour les erreurs
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
  debugInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: theme.colors.ui.card.background,
    borderRadius: 8,
    width: '100%',
    maxHeight: 300,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.backgroundText,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: theme.colors.backgroundTextSoft,
    marginBottom: 8,
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
  // Styles pour les informations de l'article
  itemInfo: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.ui.card.background,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  itemLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.backgroundTextSoft,
    marginBottom: theme.spacing.xs,
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
  },
  itemDebug: {
    fontSize: 10,
    color: theme.colors.backgroundTextSoft,
    fontFamily: 'monospace',
    marginTop: 4,
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
  },
  // Styles pour les informations de test
  testInfo: {
    backgroundColor: theme.colors.ui.card.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  testInfoTitle: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 'bold',
    color: theme.colors.accent,
    marginBottom: theme.spacing.xs,
  },
  testInfoText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.backgroundTextSoft,
    marginBottom: 2,
  },
});

export default PaymentScreen;