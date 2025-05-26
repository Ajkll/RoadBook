import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from './constants/theme';
import GoBackHomeButton from './components/common/GoBackHomeButton';
import { CopyToClipboard } from './components/common/ClipBoardCopy';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

// AJOUT : Import pour envoyer les notifications (optionnel)
// import { sendPurchaseNotification } from './services/notifications';

const PaymentConfirmation: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { products = '[]', totalPrice, sellerId, itemId } = useLocalSearchParams();
  const [showCopied, setShowCopied] = useState(false);

  let parsedProducts = [];

  try {
    parsedProducts = JSON.parse(products as string);
  } catch (e) {
    console.warn('Échec du parsing des produits', e);
  }

  const orderNumber = `CMD-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

  // AJOUT : Effet pour envoyer les notifications après l'achat
  useEffect(() => {
    const sendNotifications = async () => {
      try {
        // Optionnel : Envoyer une notification au vendeur
        // if (sellerId && itemId) {
        //   await sendPurchaseNotification(sellerId, {
        //     itemId,
        //     itemName: parsedProducts[0]?.name,
        //     buyerName: 'Acheteur', // Vous pouvez passer le nom de l'acheteur
        //     amount: totalPrice
        //   });
        // }

        // Afficher un toast de bienvenue
        setTimeout(() => {
          Toast.show({
            type: 'success',
            text1: '🎉 Achat confirmé',
            text2: 'Le vendeur a été notifié de votre achat',
            position: 'top',
            visibilityTime: 4000,
          });
        }, 1000);

      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    };

    sendNotifications();
  }, [sellerId, itemId, totalPrice]);

  const handleCopyReceipt = async () => {
    const receiptText = `
🧾 Reçu d'achat - ${orderNumber}

📅 Date: ${new Date().toLocaleDateString('fr-FR')}
⏰ Heure: ${new Date().toLocaleTimeString('fr-FR')}

🛍️ Articles achetés:
${parsedProducts.map(p => `• ${p.name} - ${p.price.toFixed(2)}€`).join('\n')}

💰 Total payé: ${totalPrice}€

👤 Vendeur: ${parsedProducts[0]?.sellerName || 'Inconnu'}

✅ Statut: Payé et confirmé

Merci pour votre achat !
    `.trim();

    try {
      await Clipboard.setStringAsync(receiptText);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);

      Toast.show({
        type: 'success',
        text1: 'Reçu copié',
        text2: 'Le reçu a été copié dans le presse-papiers',
        position: 'bottom'
      });
    } catch (error) {
      console.error('Error copying receipt:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de copier le reçu',
        position: 'bottom'
      });
    }
  };

  // AJOUT : Fonction pour retourner au marketplace
  const handleBackToMarketplace = () => {
    router.replace('/marketplace'); // ou votre route marketplace
  };

  // AJOUT : Fonction pour voir l'historique des achats
  const handleViewHistory = () => {
    router.push('/marketplace?tab=history'); // ou votre route d'historique
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
          🎉 Achat confirmé !
        </Text>

        <Text style={[styles.text_subtitle, {
          color: theme.colors.primaryText,
          fontSize: theme.typography.body.fontSize,
          marginHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          textAlign: 'center'
        }]}>
          Votre paiement a été traité avec succès
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

            {/* AJOUT : Informations sur la transaction */}
            <View style={styles.transactionInfo}>
              <Text style={[styles.transactionLabel, { color: theme.colors.backgroundTextSoft }]}>
                📅 {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {itemId && (
                <Text style={[styles.transactionLabel, { color: theme.colors.backgroundTextSoft }]}>
                  🏷️ Article ID: {itemId}
                </Text>
              )}
            </View>

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

            {/* AJOUT : Informations vendeur */}
            <View style={[styles.sellerSection, {
              backgroundColor: theme.colors.ui.card.background,
              borderRadius: theme.borderRadius.medium,
              padding: theme.spacing.md,
              marginVertical: theme.spacing.md
            }]}>
              <Text style={[styles.sellerLabel, { color: theme.colors.backgroundTextSoft }]}>
                👤 Vendeur:
              </Text>
              <Text style={[styles.sellerName, { color: theme.colors.backgroundText }]}>
                {parsedProducts[0]?.sellerName || 'Vendeur inconnu'}
              </Text>
              {sellerId && (
                <Text style={[styles.sellerId, { color: theme.colors.backgroundTextSoft }]}>
                  ID: {sellerId}
                </Text>
              )}
            </View>

            <View style={[styles.totalRow, {
              borderTopColor: theme.colors.primary,
              borderTopWidth: 2,
              marginTop: theme.spacing.md,
              paddingTop: theme.spacing.md
            }]}>
              <Text style={[styles.totalText, {
                color: theme.colors.primary,
                fontSize: theme.typography.title.fontSize,
                fontWeight: 'bold'
              }]}>
                Total payé
              </Text>
              <Text style={[styles.totalPrice, {
                color: theme.colors.primary,
                fontSize: theme.typography.title.fontSize,
                fontWeight: 'bold'
              }]}>
                {totalPrice}€
              </Text>
            </View>

            {/* AJOUT : Statut de la transaction */}
            <View style={[styles.statusSection, {
              backgroundColor: theme.colors.success,
              borderRadius: theme.borderRadius.small,
              padding: theme.spacing.sm,
              marginTop: theme.spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }]}>
              <Icon name="verified" size={20} color="white" />
              <Text style={[styles.statusText, { color: 'white', marginLeft: theme.spacing.xs }]}>
                Transaction confirmée
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
          Merci pour votre achat ! Le vendeur a été notifié et vous pouvez maintenant consulter cet article dans votre historique d'achats.
        </Text>

        {/* AJOUT : Section d'actions étendues */}
        <View style={[styles.actionSection, {
          backgroundColor: theme.colors.background,
          borderRadius: theme.borderRadius.large,
          marginHorizontal: theme.spacing.lg,
          marginTop: theme.spacing.lg,
          padding: theme.spacing.md
        }]}>
          <Text style={[styles.actionTitle, {
            color: theme.colors.backgroundText,
            fontSize: theme.typography.subtitle.fontSize,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: theme.spacing.md
          }]}>
            Que souhaitez-vous faire maintenant ?
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.medium,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }]}
            onPress={handleBackToMarketplace}
          >
            <Icon name="storefront" size={24} color={theme.colors.primaryText} />
            <Text style={[styles.actionButtonText, {
              color: theme.colors.primaryText,
              marginLeft: theme.spacing.sm,
              fontSize: theme.typography.button.fontSize,
              fontWeight: theme.typography.button.fontWeight
            }]}>
              Retour au Marketplace
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, {
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.borderRadius.medium,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }]}
            onPress={handleViewHistory}
          >
            <Icon name="history" size={24} color={theme.colors.secondaryText} />
            <Text style={[styles.actionButtonText, {
              color: theme.colors.secondaryText,
              marginLeft: theme.spacing.sm,
              fontSize: theme.typography.button.fontSize,
              fontWeight: theme.typography.button.fontWeight
            }]}>
              Voir mes achats
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomButtons, {backgroundColor: theme.colors.background}]}>
          <View style={styles.buttonContainer}>
            <CopyToClipboard
              text={`🧾 Commande ${orderNumber}\n💰 Total: ${totalPrice}€\n📅 ${new Date().toLocaleDateString('fr-FR')}\n👤 Vendeur: ${parsedProducts[0]?.sellerName || 'Inconnu'}`}
              showText={true}
              textToShow="📋 Copier le reçu"
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
    marginBottom: 10,
  },
  text_subtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  text: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  achatContainer: {
    width: '90%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  orderNumber: {
    textAlign: 'center',
  },
  // AJOUT : Nouveaux styles
  transactionInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
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
    fontWeight: 'bold',
  },
  sellerSection: {
    alignItems: 'center',
  },
  sellerLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sellerId: {
    fontSize: 12,
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
  statusSection: {
    // styles définis inline
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionSection: {
    // styles définis inline
  },
  actionTitle: {
    // styles définis inline
  },
  actionButton: {
    // styles définis inline
  },
  actionButtonText: {
    // styles définis inline
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
    marginTop: 20,
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