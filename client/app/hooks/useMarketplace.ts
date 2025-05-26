import { useState, useEffect, useCallback } from 'react';
import {
  getMarketplaceItems,
  addMarketplaceItem,
  deleteMarketplaceItem,
  getBoughtItems,
  getUserSales,
  MarketplaceItem,
  Purchase
} from '../services/firebase/marketplace';
import { authApi } from '../services/api/auth.api';
import Toast from 'react-native-toast-message';

export const useMarketplace = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userTransactions, setUserTransactions] = useState<Array<Purchase | MarketplaceItem>>([]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch user", error);
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
        text1: 'Error',
        text2: 'Failed to load items',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Nouvelle fonction pour charger les transactions utilisateur
  const loadUserTransactions = useCallback(async () => {
    if (!currentUser?.id && !currentUser?.uid) {
      console.warn('No current user found, cannot load transactions');
      return [];
    }

    try {
      const userId = currentUser.id || currentUser.uid;

      // Charger les achats ET les ventes de l'utilisateur
      const [purchases, sales] = await Promise.all([
        getBoughtItems(userId),
        getUserSales ? getUserSales(userId) : Promise.resolve([])
      ]);

      // Combiner et trier par date
      const allTransactions = [...purchases, ...sales].sort((a, b) => {
        const dateA = 'purchaseDate' in a ? a.purchaseDate : a.createdAt;
        const dateB = 'purchaseDate' in b ? b.purchaseDate : b.createdAt;

        // Gérer les dates qui peuvent être des objets Date ou des Timestamps
        const timeA = dateA instanceof Date ? dateA.getTime() :
                     (dateA && typeof dateA.toDate === 'function') ? dateA.toDate().getTime() :
                     new Date(dateA).getTime();
        const timeB = dateB instanceof Date ? dateB.getTime() :
                     (dateB && typeof dateB.toDate === 'function') ? dateB.toDate().getTime() :
                     new Date(dateB).getTime();

        return timeB - timeA; // Tri décroissant (plus récent en premier)
      });

      setUserTransactions(allTransactions);
      return allTransactions;

    } catch (error) {
      console.error('Error loading user transactions:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les transactions',
      });
      return [];
    }
  }, [currentUser]);

  // Wrapper pour addMarketplaceItem qui gère l'état isUploading
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

      // Ajouter les informations du vendeur
      const itemWithSeller = {
        ...item,
        sellerId: currentUser.id || currentUser.uid,
        sellerName: currentUser.displayName || currentUser.name || currentUser.email || 'Utilisateur anonyme'
      };

      await addMarketplaceItem(itemWithSeller, imageUri);

      // Recharger la liste des articles après ajout
      await loadItems();

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Article ajouté avec succès',
      });

      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ajouter l\'article',
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [currentUser, loadItems]);

  // Wrapper pour deleteMarketplaceItem
  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      await deleteMarketplaceItem(itemId);

      // Mettre à jour l'état local
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Article supprimé avec succès',
      });

      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de supprimer l\'article',
      });
      return false;
    }
  }, []);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredItems(items);
    } else {
      const lower = searchText.toLowerCase();
      setFilteredItems(
        items.filter(item =>
          item.title?.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchText, items]);

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
    items,
    filteredItems,
    searchText,
    setSearchText,
    currentUser,
    isLoading,
    isUploading,
    loadItems,
    addItem,
    deleteItem,
    userTransactions, // Nouveau: état des transactions
    loadUserTransactions, // Fonction compatible avec HistoryModal
  };
};