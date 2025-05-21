import { useState, useEffect, useCallback } from 'react';
import {
  getMarketplaceItems,
  addMarketplaceItem,
  deleteMarketplaceItem,
  getBoughtItems,
  MarketplaceItem
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

  return {
    items,
    filteredItems,
    searchText,
    setSearchText,
    currentUser,
    isLoading,
    isUploading,
    loadItems,
    addItem: addMarketplaceItem,
    deleteItem: deleteMarketplaceItem,
    loadUserTransactions: getBoughtItems,
  };
};