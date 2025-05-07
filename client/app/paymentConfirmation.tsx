import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from './constants/theme';
import GoBackHomeButton from './components/common/GoBackHomeButton';
import { CopyToClipboard } from './components/common/ClipBoardCopy';

const PaymentConfirmation: React.FC = () => {
  const theme = useTheme();
  const { products = '[]', totalPrice } = useLocalSearchParams();
  const [showCopied, setShowCopied] = useState(false);

  let parsedProducts = [];

  try {
    parsedProducts = JSON.parse(products);
  } catch (e) {
    console.warn('Échec du parsing des produits', e);
  }

  const orderNumber = `CMD-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

  const handleCopyReceipt = async () => {
    await Clipboard.setStringAsync(
      `Commande ${orderNumber}\n\n${parsedProducts.map(p => `${p.name} - ${p.price.toFixed(2)}€`).join('\n')}\nTotal: ${totalPrice}€`
    );
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

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

        <TouchableOpacity
          style={[styles.achatContainer, {
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.xlarge,
            margin: theme.spacing.xl
          }]}
          onPress={handleCopyReceipt}
          activeOpacity={0.9}
        >
          <View style={{padding: theme.spacing.xl}}>
            <Icon
              name="shopping-bag"
              size={100}
              color={theme.colors.primary}
              style={[styles.icon, {alignSelf: 'center'}]}
            />

            <Text style={[styles.orderNumber, {
              color: theme.colors.primary,
              fontSize: theme.typography.subtitle.fontSize,
              marginBottom: theme.spacing.md,
              textAlign: 'center',
              fontWeight: 'bold'
            }]}>
              Commande: {orderNumber}
            </Text>

            <View style={styles.productsContainer}>
              {parsedProducts.map((product, index) => (
                <View key={index} style={styles.productRow}>
                  <Text style={[styles.productName, {
                    color: theme.colors.primary,
                    fontSize: theme.typography.body.fontSize
                  }]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productPrice, {
                    color: theme.colors.primary,
                    fontSize: theme.typography.body.fontSize
                  }]}>
                    {product.price.toFixed(2)}€
                  </Text>
                </View>
              ))}
            </View>

            <View style={[styles.totalRow, {
              borderTopColor: theme.colors.primary,
              borderTopWidth: 1,
              marginTop: theme.spacing.md,
              paddingTop: theme.spacing.md
            }]}>
              <Text style={[styles.totalText, {
                color: theme.colors.primary,
                fontSize: theme.typography.title.fontSize,
                fontWeight: 'bold'
              }]}>
                Total
              </Text>
              <Text style={[styles.totalPrice, {
                color: theme.colors.primary,
                fontSize: theme.typography.title.fontSize,
                fontWeight: 'bold'
              }]}>
                {totalPrice}€
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {showCopied && (
          <View style={[styles.clipboardFeedback, {backgroundColor: theme.colors.success}]}>
            <Text style={{color: theme.colors.primaryText}}>Reçu copié dans le presse-papiers !</Text>
          </View>
        )}

        <Text style={[styles.text, {
          color: theme.colors.primaryText,
          fontSize: theme.typography.body.fontSize,
          marginHorizontal: theme.spacing.lg,
          marginTop: theme.spacing.md,
          textAlign: 'center'
        }]}>
          Merci pour votre commande, vous allez recevoir un email de confirmation.
        </Text>

        <View style={[styles.bottomButtons, {backgroundColor: theme.colors.background}]}>
          <View style={styles.buttonContainer}>
            <CopyToClipboard
              text={`Commande ${orderNumber}\nTotal: ${totalPrice}€`}
              showText={true}
              textToShow="Copier le numéro"
              containerStyle={styles.copyButton}
              textStyle={{color: theme.colors.primary}}
              iconSize={20}
            />
            <GoBackHomeButton
              containerStyle={styles.goBackButton}
              textStyle={{color: theme.colors.primary}}
            />
          </View>
        </View>
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
    paddingTop: 20,
  },
  icon: {
    marginBottom: 20,
  },
  text_confirmation: {
    textAlign: 'center',
    marginBottom: 20,
  },
  text: {
    textAlign: 'center',
    marginBottom: 20,
  },
  achatContainer: {
    width: '90%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  orderNumber: {
    textAlign: 'center',
  },
  productsContainer: {
    width: '100%',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  productName: {
    flex: 2,
    textAlign: 'left',
  },
  productPrice: {
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  totalText: {
    textAlign: 'left',
  },
  totalPrice: {
    textAlign: 'right',
  },
  clipboardFeedback: {
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  bottomButtons: {
    width: '100%',
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  copyButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  goBackButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
});

export default PaymentConfirmation;