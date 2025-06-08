import { useState, useEffect, useCallback } from 'react';
import {
  getMarketplaceItems,
  addMarketplaceItem,
  deleteMarketplaceItem,
  purchaseItem,
  recordPurchase,
  getUserPurchases,
  getUserSales,
  getTransactionHistory,
  calculateUserBalance,
  MarketplaceItem,
  Purchase
} from '../services/firebase/marketplace';
import { authApi } from '../services/api/auth.api';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';

export const useMarketplace = () => {
  const router = useRouter();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userTransactions, setUserTransactions] = useState<Array<Purchase | MarketplaceItem>>([]);
  const [userBalance, setUserBalance] = useState({
    totalEarned: 0,
    totalSpent: 0,
    balance: 0,
    totalSales: 0,
    totalPurchases: 0,
    activeListing: 0,
    deletedItems: 0
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      // Handle error silently
    }
  }, []);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getMarketplaceItems();
      setItems(items);
      setFilteredItems(items);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les articles',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserTransactions = useCallback(async () => {
    if (!currentUser?.id && !currentUser?.uid) {
      return [];
    }

    try {
      const userId = currentUser.id || currentUser.uid;

      const [transactions, balance] = await Promise.all([
        getTransactionHistory(userId).catch(error => {
          console.error('Error loading transactions:', error);
          return [];
        }),
        calculateUserBalance(userId).catch(error => {
          console.error('Error calculating balance:', error);
          return {
            totalEarned: 0,
            totalSpent: 0,
            balance: 0,
            totalSales: 0,
            totalPurchases: 0,
            activeListing: 0,
            deletedItems: 0
          };
        })
      ]);

      setUserTransactions(transactions);
      setUserBalance(balance);

      return transactions;

    } catch (error) {
      console.error('Error in loadUserTransactions:', error);

      setUserTransactions([]);
      setUserBalance({
        totalEarned: 0,
        totalSpent: 0,
        balance: 0,
        totalSales: 0,
        totalPurchases: 0,
        activeListing: 0,
        deletedItems: 0
      });

      return [];
    }
  }, [currentUser]);

  const navigateToPayment = useCallback((item: MarketplaceItem) => {
    if (!currentUser?.id && !currentUser?.uid) {
      Toast.show({
        type: 'error',
        text1: 'Connexion requise',
        text2: 'Vous devez être connecté pour acheter',
      });
      return false;
    }

    if (!item.id || item.id === '') {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Cet article n\'a pas d\'identifiant valide',
      });
      return false;
    }

    const userId = currentUser.id || currentUser.uid;
    if (item.sellerId === userId) {
      Toast.show({
        type: 'error',
        text1: 'Achat impossible',
        text2: 'Vous ne pouvez pas acheter votre propre article',
      });
      return false;
    }

    if (item.isSold) {
      Toast.show({
        type: 'error',
        text1: 'Article indisponible',
        text2: 'Cet article a déjà été vendu',
      });
      return false;
    }

    if (item.isDeleted) {
      Toast.show({
        type: 'error',
        text1: 'Article indisponible',
        text2: 'Cet article a été retiré de la vente',
      });
      return false;
    }

    const productData = {
      id: item.id,
      title: item.title,
      description: item.description || '',
      price: item.price,
      sellerName: item.sellerName,
      sellerId: item.sellerId,
      imageUrl: item.imageUrl || ''
    };

    try {
      if (typeof router !== 'undefined' && router.push) {
        router.push({
          pathname: '/PaymentScreen',
          params: {
            product: JSON.stringify(productData),
            sellerId: item.sellerId,
            itemId: item.id,
            backupItemId: item.id,
            sellerName: item.sellerName,
            itemTitle: item.title,
            itemPrice: item.price.toString()
          }
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur de navigation',
          text2: 'Impossible d\'ouvrir l\'écran de paiement',
        });
        return false;
      }

      return true;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de navigation',
        text2: 'Impossible d\'ouvrir l\'écran de paiement',
      });
      return false;
    }
  }, [currentUser, router]);

  const addItem = useCallback(async (
    item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'imageUrl'>,
    imageUri: string = ''
  ): Promise<boolean> => {
    if (!currentUser?.id && !currentUser?.uid) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Utilisateur non connecté',
      });
      return false;
    }

    try {
      setIsUploading(true);

      const itemWithSeller = {
        ...item,
        sellerId: currentUser.id || currentUser.uid,
        sellerName: currentUser.displayName || currentUser.name || currentUser.email || 'Utilisateur anonyme',
        sellerAvatar: currentUser.photoURL || currentUser.avatar || ''
      };

      await addMarketplaceItem(itemWithSeller, imageUri);
      await loadItems();

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Article ajouté avec succès',
      });

      return true;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ajouter l\'article: ' + (error.message || 'Erreur inconnue'),
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [currentUser, loadItems]);

  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      await deleteMarketplaceItem(itemId);
      await loadItems();
      await loadUserTransactions();

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Article supprimé avec succès',
      });

      return true;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de supprimer l\'article',
      });
      return false;
    }
  }, [loadItems, loadUserTransactions]);

  // Fonction buyItem CORRIGÉE pour les achats directs
  const buyItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!currentUser?.id && !currentUser?.uid) {
      Toast.show({
        type: 'error',
        text1: 'Connexion requise',
        text2: 'Vous devez être connecté pour acheter',
      });
      return false;
    }

    const item = items.find(i => i.id === itemId);
    if (!item) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Article introuvable',
      });
      return false;
    }

    const userId = currentUser.id || currentUser.uid;
    const userName = currentUser.displayName || currentUser.name || currentUser.email || 'Acheteur anonyme';

    try {
      await purchaseItem(itemId, userId, userName);
      await recordPurchase(itemId, userId, userName);

      // Recharger les données pour mettre à jour l'affichage
      await loadItems();
      await loadUserTransactions();

      Toast.show({
        type: 'success',
        text1: 'Achat réussi',
        text2: `Vous avez acheté "${item.title}"`,
      });

      return true;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur d\'achat',
        text2: error.message || 'Une erreur est survenue',
      });
      return false;
    }
  }, [currentUser, items, loadItems, loadUserTransactions]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredItems(items);
    } else {
      const lower = searchText.toLowerCase();
      setFilteredItems(
        items.filter(item =>
          item.title?.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower) ||
          item.sellerName?.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchText, items]);

  useEffect(() => {
    fetchCurrentUser();
    loadItems();
  }, [fetchCurrentUser, loadItems]);

  useEffect(() => {
    if (currentUser?.id || currentUser?.uid) {
      loadUserTransactions();
    }
  }, [currentUser, loadUserTransactions]);

  return {
    items,
    filteredItems,
    searchText,
    setSearchText,
    currentUser,
    isLoading,
    isUploading,
    userTransactions,
    userBalance,

    // Fonctions principales
    loadItems,
    addItem,
    deleteItem,
    buyItem, // Fonction d'achat corrigée
    navigateToPayment,
    loadUserTransactions,

    // Statistiques
    stats: {
      totalItems: items.length,
      availableItems: items.filter(item => !item.isSold && !item.isDeleted).length,
      userItems: items.filter(item => item.sellerId === (currentUser?.id || currentUser?.uid)).length,
    }
  };
};