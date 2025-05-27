import { useState, useEffect, useCallback } from 'react';
import {
  getMarketplaceItems,
  addMarketplaceItem,
  deleteMarketplaceItem,
  purchaseItem,
  getUserPurchases,
  getUserSales,
  getTransactionHistory,
  calculateUserBalance,
  MarketplaceItem,
  Purchase
} from '../services/firebase/marketplace';
import { authApi } from '../services/api/auth.api';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router'; // Ajout de l'import du router

export const useMarketplace = () => {
  const router = useRouter(); // Initialisation du router
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
      console.log('👤 Utilisateur chargé:', user?.id || user?.uid);
    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('📦 Chargement des articles...');
      const items = await getMarketplaceItems(); // Ne charge que les articles actifs
      setItems(items);
      setFilteredItems(items);
      console.log(`✅ ${items.length} articles chargés`);
    } catch (error) {
      console.error('❌ Erreur chargement articles:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les articles',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les transactions utilisateur avec calcul de balance
  const loadUserTransactions = useCallback(async () => {
    if (!currentUser?.id && !currentUser?.uid) {
      console.warn('No current user found, cannot load transactions');
      return [];
    }

    try {
      const userId = currentUser.id || currentUser.uid;
      console.log('📊 Chargement transactions pour:', userId);

      // Charger les transactions et la balance
      const [transactions, balance] = await Promise.all([
        getTransactionHistory(userId).catch(error => {
          console.error('❌ Erreur chargement transactions:', error);
          return []; // Retourner un tableau vide en cas d'erreur
        }),
        calculateUserBalance(userId).catch(error => {
          console.error('❌ Erreur calcul balance:', error);
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

      console.log(`✅ ${transactions.length} transactions chargées`);
      console.log('💰 Balance:', balance);

      setUserTransactions(transactions);
      setUserBalance(balance);

      return transactions;

    } catch (error) {
      console.error('❌ Erreur loading user transactions:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les transactions',
      });

      // Réinitialiser les états en cas d'erreur
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

  // Fonction de navigation vers le paiement (au lieu d'achat direct)
  const navigateToPayment = useCallback((item: MarketplaceItem) => {
    if (!currentUser?.id && !currentUser?.uid) {
      Toast.show({
        type: 'error',
        text1: 'Connexion requise',
        text2: 'Vous devez être connecté pour acheter',
      });
      return false;
    }

    // Validation de l'article
    if (!item.id || item.id === '') {
      console.error('❌ Article sans ID:', item);
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

    // Préparer les données pour l'écran de paiement
    const productData = {
      id: item.id,
      title: item.title,
      description: item.description || '',
      price: item.price,
      sellerName: item.sellerName,
      sellerId: item.sellerId,
      imageUrl: item.imageUrl || ''
    };

    console.log('🛒 Navigation vers le paiement:', {
      productId: productData.id,
      sellerId: productData.sellerId,
      title: productData.title,
      price: productData.price
    });

    // Navigation vers l'écran de paiement
    try {
      // Ici, vous devez utiliser votre router (React Navigation, Expo Router, etc.)
      // Exemple avec Expo Router:
      if (typeof router !== 'undefined' && router.push) {
        router.push({
          pathname: '/payment',
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
        // Fallback si router n'est pas disponible
        console.warn('⚠️ Router non disponible, impossible de naviguer vers le paiement');
        Toast.show({
          type: 'error',
          text1: 'Erreur de navigation',
          text2: 'Impossible d\'ouvrir l\'écran de paiement',
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur navigation vers paiement:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de navigation',
        text2: 'Impossible d\'ouvrir l\'écran de paiement',
      });
      return false;
    }
  }, [currentUser]);

  // Wrapper pour addMarketplaceItem qui gère l'état isUploading
  const addItem = useCallback(async (
    item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'imageUrl'>,
    imageUri: string = ''
  ): Promise<boolean> => {
    console.log('🔄 Hook addItem appelé avec:', {
      item: {
        title: item.title,
        description: item.description,
        price: item.price,
        sellerName: item.sellerName,
        sellerId: item.sellerId
      },
      imageUri: imageUri ? 'Image fournie' : 'Pas d\'image',
      currentUser: currentUser ? 'Connecté' : 'Non connecté'
    });

    if (!currentUser?.id && !currentUser?.uid) {
      console.log('❌ Hook: Utilisateur non connecté');
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Utilisateur non connecté',
      });
      return false;
    }

    try {
      setIsUploading(true);
      console.log('📤 Hook: Début de l\'upload...');

      // Ajouter les informations du vendeur
      const itemWithSeller = {
        ...item,
        sellerId: currentUser.id || currentUser.uid,
        sellerName: currentUser.displayName || currentUser.name || currentUser.email || 'Utilisateur anonyme',
        sellerAvatar: currentUser.photoURL || currentUser.avatar || ''
      };

      console.log('➕ Hook: Ajout article avec données complètes:', itemWithSeller);

      await addMarketplaceItem(itemWithSeller, imageUri);

      console.log('✅ Hook: Article ajouté en base');

      // Recharger la liste des articles après ajout
      console.log('🔄 Hook: Rechargement des articles...');
      await loadItems();

      console.log('✅ Hook: Articles rechargés');

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Article ajouté avec succès',
      });

      return true;
    } catch (error) {
      console.error('❌ Hook: Error adding item:', error);
      console.error('❌ Hook: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ajouter l\'article: ' + (error.message || 'Erreur inconnue'),
      });
      return false;
    } finally {
      setIsUploading(false);
      console.log('🏁 Hook: Fin du processus d\'ajout');
    }
  }, [currentUser, loadItems]);

  // Wrapper pour deleteMarketplaceItem (suppression logique)
  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Suppression article:', itemId);

      await deleteMarketplaceItem(itemId);

      // Recharger les articles (l'article supprimé disparaîtra de la liste)
      await loadItems();

      // Recharger les transactions pour mettre à jour l'historique
      await loadUserTransactions();

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Article supprimé avec succès',
      });

      return true;
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de supprimer l\'article',
      });
      return false;
    }
  }, [loadItems, loadUserTransactions]);

  // Filtrage des articles en fonction de la recherche
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

  // Initialisation
  useEffect(() => {
    fetchCurrentUser();
    loadItems();
  }, [fetchCurrentUser, loadItems]);

  // Charger les transactions quand l'utilisateur change
  useEffect(() => {
    if (currentUser?.id || currentUser?.uid) {
      loadUserTransactions();
    }
  }, [currentUser, loadUserTransactions]);

  return {
    // États
    items,
    filteredItems,
    searchText,
    setSearchText,
    currentUser,
    isLoading,
    isUploading,
    userTransactions,
    userBalance,

    // Fonctions
    loadItems,
    addItem,
    deleteItem,
    navigateToPayment, // Fonction de navigation vers le paiement
    loadUserTransactions,

    // Statistiques calculées
    stats: {
      totalItems: items.length,
      availableItems: items.filter(item => !item.isSold && !item.isDeleted).length,
      userItems: items.filter(item => item.sellerId === (currentUser?.id || currentUser?.uid)).length,
    }
  };
};