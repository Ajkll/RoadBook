import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './constants/theme';

const PaymentScreen: React.FC = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'google' | 'bancontact'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCVC] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cardNumberError, setCardNumberError] = useState('');
  const [expiryError, setExpiryError] = useState('');
  const router = useRouter();

  const products = [
    { name: 'T-shirt', price: 15.00 },
    { name: 'Pantalon', price: 20.00 },
    { name: 'Casquette', price: 10.00 },
  ];

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

  const handlePayment = () => {
    setIsLoading(true);
    setErrorMessage('');
    setCardNumberError('');
    setExpiryError('');

    if (paymentMethod === 'card') {
      if (!cardNumber || !expiry || !cvc) {
        setErrorMessage('Veuillez remplir tous les champs de votre carte');
        setIsLoading(false);
        return;
      }

      if (!/^\d{16}$/.test(cardNumber)) {
        setCardNumberError('Le numéro de carte doit contenir exactement 16 chiffres.');
        setIsLoading(false);
        return;
      }

      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryRegex.test(expiry)) {
        setExpiryError("Le format de la date d'expiration doit être MM/YY");
        setIsLoading(false);
        return;
      }

      if (!/^\d{3}$/.test(cvc)) {
        setErrorMessage('Le CVC doit contenir exactement 3 chiffres.');
        setIsLoading(false);
        return;
      }
    }
    setTimeout(() => {
      router.push({
        pathname: '/paymentConfirmation',
        params: {
          products: JSON.stringify(products),
          totalPrice: products.reduce((acc, product) => acc + product.price, 0).toFixed(2),
        },
      });
      setIsLoading(false);
    }, 5000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Paiement</Text>

        <View style={styles.summary}>
          <Text style={styles.label}>Produits:</Text>
          {products.map((product, index) => (
            <View key={index} style={styles.productContainer}>
              <Text style={[styles.value, styles.productName]}>{product.name}</Text>
              <Text style={styles.productPrice}>{product.price.toFixed(2)}€</Text>
            </View>
          ))}

          <Text style={styles.label}>Total:</Text>
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
              placeholder="Numéro de carte"
              placeholderTextColor={theme.colors.backgroundTextSoft}
              keyboardType="numeric"
              value={cardNumber}
              onChangeText={setCardNumber}
              onBlur={() => validateCardNumber(cardNumber)}
            />
            {paymentMethod === 'card' && cardNumberError ? (
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
            {paymentMethod === 'card' && expiryError ? (
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
          </>
        )}

        {paymentMethod === 'card' && errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {paymentMethod === 'card'
              ? 'Payer par Carte'
              : paymentMethod === 'paypal'
              ? 'Continuer avec PayPal'
              : paymentMethod === 'google'
              ? 'Continuer avec Google Pay'
              : 'Continuer avec Bancontact'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (theme) => StyleSheet.create({
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
  loadingText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.backgroundText,
    marginTop: theme.spacing.sm,
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
});

export default PaymentScreen;