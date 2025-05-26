import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceItem, Purchase } from '../../services/firebase/marketplace';

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  transactions: Array<Purchase | MarketplaceItem>;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  visible,
  onClose,
  currentUser,
  transactions
}) => {
  const { colors, spacing } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Debug des transactions reçues
  useEffect(() => {
    if (visible) {
      console.log('📊 HistoryModal ouvert avec:');
      console.log('👤 CurrentUser:', currentUser?.id || currentUser?.uid);
      console.log('📋 Transactions:', transactions?.length || 0);
      console.log('🔍 Première transaction:', transactions?.[0]);

      if (transactions && transactions.length > 0) {
        console.log('📈 Types de transactions:');
        transactions.forEach((item, index) => {
          const isPurchase = 'buyerId' in item;
          console.log(`  ${index + 1}: ${isPurchase ? 'Achat' : 'Vente'} - ${isPurchase ? (item as Purchase).itemData?.title : (item as MarketplaceItem).title}`);
        });
      }
    }
  }, [visible, currentUser, transactions]);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleBackdropPress = useCallback(() => {
    console.log('❌ Fermeture HistoryModal via backdrop');
    onClose();
  }, [onClose]);

  const renderTransactionItem = useCallback((item: Purchase | MarketplaceItem, index: number) => {
    try {
      const isPurchase = 'buyerId' in item;

      // Gestion sécurisée des dates
      let date: Date;
      if (isPurchase) {
        const purchase = item as Purchase;
        date = purchase.purchaseDate instanceof Date
          ? purchase.purchaseDate
          : new Date(purchase.purchaseDate);
      } else {
        const marketItem = item as MarketplaceItem;
        date = marketItem.createdAt instanceof Date
          ? marketItem.createdAt
          : new Date(marketItem.createdAt);
      }

      const title = isPurchase
        ? (item as Purchase).itemData?.title || 'Article inconnu'
        : (item as MarketplaceItem).title;

      const amount = isPurchase
        ? (item as Purchase).itemData?.price || (item as Purchase).price || 0
        : (item as MarketplaceItem).price;

      // Amélioration de la logique pour l'autre partie
      let otherParty = '';
      let transactionType = '';
      let statusColor = colors.backgroundTextSoft;

      if (isPurchase) {
        transactionType = 'Achat';
        otherParty = (item as Purchase).itemData?.sellerName || 'Vendeur inconnu';
        statusColor = colors.error; // Rouge pour les achats (sortie d'argent)
      } else {
        const marketItem = item as MarketplaceItem;
        if (marketItem.isSold) {
          transactionType = 'Vendu';
          otherParty = marketItem.buyerName || 'Article vendu';
          statusColor = colors.success; // Vert pour les ventes (entrée d'argent)
        } else {
          transactionType = 'En vente';
          otherParty = 'Article disponible';
          statusColor = colors.primary; // Bleu pour les articles en vente
        }
      }

      return (
        <View
          key={`${isPurchase ? 'purchase' : 'sale'}-${item.id || index}`}
          style={[
            styles.transactionItem,
            {
              backgroundColor: colors.ui.card.background,
              marginBottom: spacing.sm,
              padding: spacing.md,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: statusColor,
            }
          ]}
        >
          <View style={styles.transactionHeader}>
            <Text
              style={[styles.transactionTitle, { color: colors.backgroundText }]}
              numberOfLines={2}
            >
              {title}
            </Text>
            <View style={styles.amountContainer}>
              <Text style={[styles.transactionAmount, { color: statusColor }]}>
                {isPurchase ? '-' : '+'}€{amount.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.transactionMeta}>
            <View style={styles.transactionTypeContainer}>
              <Ionicons
                name={isPurchase ? 'arrow-down-outline' : 'arrow-up-outline'}
                size={16}
                color={statusColor}
              />
              <Text style={[styles.transactionType, { color: statusColor }]}>
                {transactionType}
              </Text>
            </View>
            <Text style={[styles.otherParty, { color: colors.backgroundTextSoft }]}>
              {otherParty}
            </Text>
          </View>

          <Text style={[styles.transactionDate, { color: colors.backgroundTextSoft }]}>
            {date.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>

          {/* Debug info en mode développement */}
          {__DEV__ && (
            <Text style={[styles.debugInfo, { color: colors.backgroundTextSoft }]}>
              Debug: {isPurchase ? 'Achat' : 'Vente'} | ID: {item.id || 'N/A'}
            </Text>
          )}
        </View>
      );
    } catch (error) {
      console.error('❌ Erreur rendu transaction:', error, item);
      return (
        <View key={`error-${index}`} style={[styles.errorItem, { backgroundColor: colors.ui.card.background }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Erreur d'affichage de la transaction
          </Text>
        </View>
      );
    }
  }, [colors, spacing]);

  const calculateTotalBalance = useCallback(() => {
    try {
      let balance = 0;
      transactions.forEach(item => {
        const isPurchase = 'buyerId' in item;
        const amount = isPurchase
          ? (item as Purchase).itemData?.price || (item as Purchase).price || 0
          : (item as MarketplaceItem).price;

        if (isPurchase) {
          balance -= amount; // Soustraction pour les achats
        } else if ((item as MarketplaceItem).isSold) {
          balance += amount; // Addition pour les ventes
        }
      });
      return balance;
    } catch (error) {
      console.error('❌ Erreur calcul balance:', error);
      return 0;
    }
  }, [transactions]);

  if (!visible) return null;

  const totalBalance = calculateTotalBalance();
  const totalTransactions = transactions?.length || 0;
  const purchases = transactions?.filter(item => 'buyerId' in item).length || 0;
  const sales = transactions?.filter(item => !('buyerId' in item) && (item as MarketplaceItem).isSold).length || 0;

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }} />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={[styles.modalHeader, { padding: spacing.md, borderBottomColor: colors.ui.card.border }]}>
          <View>
            <Text style={[styles.modalTitle, { color: colors.backgroundText }]}>
              Historique des transactions
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.backgroundTextSoft }]}>
              {totalTransactions} transaction{totalTransactions > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.backgroundText} />
          </TouchableOpacity>
        </View>

        {/* Debug info en mode développement */}
        {__DEV__ && (
          <View style={[styles.debugContainer, { backgroundColor: colors.ui.card.background, margin: spacing.md }]}>
            <Text style={[styles.debugTitle, { color: colors.backgroundText }]}>
              🔍 Debug Info:
            </Text>
            <Text style={[styles.debugText, { color: colors.backgroundTextSoft }]}>
              User: {currentUser?.id || currentUser?.uid || 'Non connecté'}
            </Text>
            <Text style={[styles.debugText, { color: colors.backgroundTextSoft }]}>
              Transactions: {totalTransactions} | Achats: {purchases} | Ventes: {sales}
            </Text>
          </View>
        )}

        {/* Résumé financier */}
        {totalTransactions > 0 && (
          <View style={[styles.summaryContainer, { padding: spacing.md, backgroundColor: colors.ui.card.background }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.backgroundTextSoft }]}>
                  Balance totale
                </Text>
                <Text style={[
                  styles.summaryValue,
                  { color: totalBalance >= 0 ? colors.success : colors.error }
                ]}>
                  {totalBalance >= 0 ? '+' : ''}€{totalBalance.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.backgroundTextSoft }]}>
                  Achats / Ventes
                </Text>
                <Text style={[styles.summaryValue, { color: colors.backgroundText }]}>
                  {purchases} / {sales}
                </Text>
              </View>
            </View>
          </View>
        )}

        <ScrollView
          style={{ padding: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {!transactions || transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={colors.backgroundTextSoft}
              />
              <Text style={[styles.emptyTitle, { color: colors.backgroundText }]}>
                Aucune transaction
              </Text>
              <Text style={[styles.emptyText, { color: colors.backgroundTextSoft }]}>
                Vos achats et ventes apparaîtront ici
              </Text>
              {__DEV__ && (
                <Text style={[styles.debugText, { color: colors.backgroundTextSoft, marginTop: 16 }]}>
                  Debug: transactions = {transactions ? 'array vide' : 'null/undefined'}
                </Text>
              )}
            </View>
          ) : (
            transactions.map(renderTransactionItem)
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    marginTop: '20%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  debugContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  debugInfo: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  otherParty: {
    fontSize: 14,
  },
  transactionDate: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default HistoryModal;