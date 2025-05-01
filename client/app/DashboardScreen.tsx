// commentaire

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

const PaymentScreen: React.FC = () => {
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
          products: JSON.stringify(products),  // Passer la valeur du nom du produit
          totalPrice: products.reduce((acc, product) => acc + product.price, 0).toFixed(2), // Calcul du total
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
            <Text style={styles.methodText}>💳 Carte</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, paymentMethod === 'paypal' && styles.methodSelected]}
            onPress={() => setPaymentMethod('paypal')}
          >
            <Text style={styles.methodText}>🅿️ PayPal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, paymentMethod === 'google' && styles.methodSelected]}
            onPress={() => setPaymentMethod('google')}
          >
            <Text style={styles.methodText}>📱 Google Pay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, paymentMethod === 'bancontact' && styles.methodSelected]}
            onPress={() => setPaymentMethod('bancontact')}
          >
            <Text style={styles.methodText}>🇧🇪 Bancontact</Text>
          </TouchableOpacity>
        </View>

        {paymentMethod === 'card' && (
          <>
            <Text style={styles.sectionTitle}>Détails de la carte</Text>
            <TextInput
              style={styles.input}
              placeholder="Numéro de carte"
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
            <ActivityIndicator size="large" color="#1E90FF" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handlePayment} disabled={isLoading}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summary: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#777',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  methodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  methodButton: {
    flexBasis: '48%',
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  methodSelected: {
    backgroundColor: '#1E90FF',
  },
  methodText: {
    color: '#000',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  productContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    flex: 2,
    fontSize: 16,
  },
  productPrice: {
    textAlign: 'right',
    flex: 1,
    fontSize: 16,
  },

});

export default PaymentScreen;
