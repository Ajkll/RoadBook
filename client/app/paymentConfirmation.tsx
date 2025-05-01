import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from './constants/theme';

const PaymentConfirmation: React.FC = () => {
  const theme = useTheme();
  const { products = '[]', totalPrice } = useLocalSearchParams();

  let parsedProducts = [];

  try {
    parsedProducts = JSON.parse(products);
  } catch (e) {
    console.warn('Échec du parsing des produits', e);
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.primary }]}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: theme.spacing.lg }]}>
        <Icon
          name="check-circle"
          size={200}
          color={theme.colors.primaryText}
          style={styles.icon}
        />
        <Text style={[styles.text_confirmation, {
          color: theme.colors.primaryText,
          fontSize: theme.typography.SuperTitle.fontSize,
          fontWeight: theme.typography.SuperTitle.fontWeight,
          marginHorizontal: theme.spacing.lg
        }]}>
          Votre paiement pour le(s) article(s) suivant a bien été effectué :
        </Text>

        <View style={[styles.achat, {
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          borderRadius: theme.borderRadius.xlarge,
          margin: theme.spacing.xl
        }]}>
          <Icon
            name="shopping-bag"
            size={100}
            color={theme.colors.primary}
            style={styles.icon}
          />

          {/* Affiche chaque produit */}
          <View style={styles.productsList}>
            {parsedProducts.map((product, index) => (
              <View key={index} style={styles.productRow}>
                <Text style={[styles.productName, {
                  color: theme.colors.primary,
                  fontWeight: theme.typography.button.fontWeight
                }]}>
                  {product.name}
                </Text>
                <Text style={[styles.productPrice, {
                  color: theme.colors.primary,
                  fontWeight: theme.typography.button.fontWeight,
                  minWidth: 100
                }]}>
                  {product.price.toFixed(2)}€
                </Text>
              </View>
            ))}
          </View>

          {/* Affiche le total */}
          <View style={[styles.totalRow, {
            borderTopColor: theme.colors.primary,
            borderTopWidth: 1,
            paddingTop: theme.spacing.md
          }]}>
            <Text style={[styles.totalText, {
              color: theme.colors.primary,
              fontSize: theme.typography.title.fontSize,
              fontWeight: theme.typography.title.fontWeight
            }]}>
              Total
            </Text>
            <Text style={[styles.totalPrice, {
              color: theme.colors.primary,
              fontSize: theme.typography.title.fontSize,
              fontWeight: theme.typography.title.fontWeight
            }]}>
              {totalPrice}€
            </Text>
          </View>
        </View>

        <Text style={[styles.text, {
          color: theme.colors.primaryText,
          fontSize: theme.typography.body.fontSize,
          fontWeight: theme.typography.body.fontWeight,
          marginHorizontal: theme.spacing.lg
        }]}>
          Merci pour votre commande, vous allez recevoir un email reprenant les informations de votre commande.
        </Text>

        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: theme.colors.background,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.borderRadius.medium,
            margin: theme.spacing.lg
          }]}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, {
            color: theme.colors.primary,
            fontWeight: theme.typography.button.fontWeight,
            fontSize: theme.typography.button.fontSize
          }]}>
            Appuyer ici
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
    alignSelf: 'center',
  },
  text_confirmation: {
    textAlign: 'center',
  },
  text: {
    textAlign: 'center',
  },
  button: {},
  buttonText: {},
  achat: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  productsList: {
    marginBottom: 20,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productName: {
    flex: 1,
  },
  productPrice: {
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  totalText: {},
  totalPrice: {},
});

export default PaymentConfirmation;