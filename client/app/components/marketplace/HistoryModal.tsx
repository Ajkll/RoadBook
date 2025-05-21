import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getBoughtItems } from '../../services/firebase/marketplace';
import { TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';

interface HistoryModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  currentUser: any;
  items: any[];
}

const HistoryModal: React.FC<HistoryModalProps> = ({ visible, setVisible, currentUser, items }) => {
  const { colors, spacing } = useTheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);  // <-- Added this line

  useEffect(() => {
    if (visible && currentUser) {
      loadUserTransactions();
    }
  }, [visible]);

  const loadUserTransactions = async () => {
    setLoading(true);
    try {
      const soldItems = items.filter(item => item.sellerId === currentUser.id);
      const boughtItems = await getBoughtItems(currentUser.id);

      const mergedTransactions = [
        ...soldItems.map(item => ({
          ...item,
          type: 'vente',
          date: item.createdAt
        })),
        ...boughtItems.map(item => ({
          ...item,
          type: 'achat',
          date: item.purchaseDate || new Date()
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(mergedTransactions);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: "Impossible de charger l'historique",
        position: 'bottom'
      });
      console.error("Erreur dans loadUserTransactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
      {/* ... rest of your JSX remains the same ... */}
    </View>
  );
};

const styles = StyleSheet.create({
  // ... your styles remain the same ...
});

export default HistoryModal;