import { storage, db } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  writeBatch,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  orderBy
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { logger } from '../../utils/logger';
import Toast from 'react-native-toast-message';

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerName: string;
  sellerId: string;
  sellerAvatar?: string;
  imageUrl: string;
  createdAt: Date;
  isSold?: boolean;
  buyerId?: string;
  buyerName?: string;
  purchaseDate?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  status?: 'active' | 'sold' | 'deleted';
}

export interface Purchase {
  id: string;
  itemId: string;
  buyerId: string;
  price: number;
  buyerName: string;
  purchaseDate: Date;
  // Nouveaux champs pour éviter les requêtes supplémentaires
  itemTitle?: string;
  sellerName?: string;
  sellerId?: string;
  itemDescription?: string;
  itemImageUrl?: string;
  // Garder itemData pour la compatibilité
  itemData?: MarketplaceItem;
}

export interface Transaction {
  id: string;
  itemId: string;
  sellerId: string;
  buyerId: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export const getMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
  try {
    const q = query(
      collection(db, 'marketplace'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const item = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        purchaseDate: data.purchaseDate?.toDate ? data.purchaseDate.toDate() : data.purchaseDate,
        deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : data.deletedAt,
        status: data.status || 'active',
        isSold: data.isSold || false,
        isDeleted: data.isDeleted || false
      } as MarketplaceItem;

      return item;
    })
    .filter(item => {
      return !item.isSold && !item.isDeleted;
    });

    return items;
  } catch (error) {
    logger.error('Error getting marketplace items:', error);
    return [];
  }
};

export const getAllMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'marketplace'));

    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        purchaseDate: data.purchaseDate?.toDate ? data.purchaseDate.toDate() : data.purchaseDate,
        deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : data.deletedAt,
        status: data.status || 'active'
      } as MarketplaceItem;
    });

    return items;
  } catch (error) {
    return [];
  }
};

export const addMarketplaceItem = async (
  item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'imageUrl'>,
  imageUri: string = ''
): Promise<void> => {
  try {
    let imageUrl = '';
    if (imageUri) {
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `marketplace/${Date.now()}_${Math.random().toString(36).substring(7)}`);
        const snapshot = await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (imageError) {
        // Continue sans image en cas d'erreur
      }
    }

    const itemData = {
      ...item,
      imageUrl,
      createdAt: serverTimestamp(),
      isSold: false,
      isDeleted: false,
      status: 'active'
    };

    const docRef = await addDoc(collection(db, 'marketplace'), itemData);

  } catch (error) {
    logger.error('Error adding marketplace item:', error);
    throw error;
  }
};

export const deleteMarketplaceItem = async (itemId: string): Promise<void> => {
  try {
    if (!itemId || itemId === '') {
      throw new Error('ID de l\'article manquant pour la suppression');
    }

    const itemRef = doc(db, 'marketplace', itemId);
    await updateDoc(itemRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      status: 'deleted'
    });

    logger.info('Marketplace item marked as deleted:', itemId);
  } catch (error) {
    logger.error('Error deleting marketplace item:', error);
    throw error;
  }
};

export const permanentDeleteMarketplaceItem = async (itemId: string): Promise<void> => {
  try {
    if (!itemId || itemId === '') {
      throw new Error('ID de l\'article manquant pour la suppression');
    }

    await deleteDoc(doc(db, 'marketplace', itemId));
    logger.info('Marketplace item permanently deleted:', itemId);
  } catch (error) {
    logger.error('Error permanently deleting marketplace item:', error);
    throw error;
  }
};

export const purchaseItem = async (itemId: string, buyerId: string, buyerName: string = '') => {
  try {
    if (!itemId || itemId === '') {
      throw new Error('ID de l\'article manquant pour l\'achat');
    }

    if (!buyerId || buyerId === '') {
      throw new Error('ID de l\'acheteur manquant');
    }

    const batch = writeBatch(db);

    const itemRef = doc(db, 'marketplace', itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      throw new Error("L'article n'existe pas ou a été supprimé");
    }

    const itemData = itemSnap.data();

    if (itemData.isSold) {
      throw new Error("Cet article a déjà été vendu");
    }

    if (itemData.isDeleted) {
      throw new Error("Cet article a été supprimé");
    }

    if (itemData.sellerId === buyerId) {
      throw new Error("Vous ne pouvez pas acheter votre propre article");
    }

    const transactionRef = doc(collection(db, 'transactions'));
    batch.set(transactionRef, {
      itemId,
      sellerId: itemData.sellerId,
      buyerId,
      amount: itemData.price,
      status: 'completed',
      createdAt: serverTimestamp()
    });

    batch.update(itemRef, {
      isSold: true,
      buyerId,
      buyerName,
      purchaseDate: serverTimestamp(),
      status: 'sold'
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const recordPurchase = async (
  itemId: string,
  buyerId: string,
  buyerName: string
): Promise<void> => {
  try {
    if (!itemId || itemId === '' || typeof itemId !== 'string') {
      throw new Error('ID de l\'article manquant ou invalide pour l\'enregistrement');
    }

    if (!buyerId || buyerId === '' || typeof buyerId !== 'string') {
      throw new Error('ID de l\'acheteur manquant ou invalide');
    }

    // Récupérer les détails de l'article pour l'enregistrement d'achat
    const itemRef = doc(db, 'marketplace', itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      throw new Error("L'article n'existe pas");
    }

    const itemData = itemSnap.data();

    // Créer un enregistrement d'achat séparé pour l'acheteur
    await addDoc(collection(db, 'purchases'), {
      itemId,
      buyerId,
      buyerName,
      price: itemData.price,
      sellerName: itemData.sellerName,
      sellerId: itemData.sellerId,
      itemTitle: itemData.title,
      itemDescription: itemData.description || '',
      itemImageUrl: itemData.imageUrl || '',
      purchaseDate: serverTimestamp(),
    });

  } catch (error) {
    logger.error('Error recording purchase:', error);
    throw error;
  }
};

export const getSellableItems = async (): Promise<MarketplaceItem[]> => {
  try {
    const q = query(collection(db, 'marketplace'));
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      isSold: doc.data().isSold || false,
      isDeleted: doc.data().isDeleted || false
    })) as MarketplaceItem[];

    return items.filter(item => !item.isSold && !item.isDeleted);
  } catch (error) {
    logger.error('Error getting sellable items:', error);
    return [];
  }
};

export const getUserPurchases = async (userId: string): Promise<Purchase[]> => {
  try {
    const q = query(collection(db, 'purchases'), where('buyerId', '==', userId));
    const querySnapshot = await getDocs(q);

    const purchases = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();

      // Créer un objet Purchase avec les données stockées directement
      const purchase: Purchase = {
        id: docSnapshot.id,
        itemId: data.itemId || '',
        buyerId: data.buyerId,
        price: data.price || 0,
        buyerName: data.buyerName,
        purchaseDate: data.purchaseDate?.toDate ? data.purchaseDate.toDate() : new Date(data.purchaseDate),
        // Utiliser les détails stockés directement
        itemTitle: data.itemTitle,
        sellerName: data.sellerName,
        sellerId: data.sellerId,
        itemDescription: data.itemDescription,
        itemImageUrl: data.itemImageUrl,
      };

      return purchase;
    });

    return purchases.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());
  } catch (error) {
    logger.error('Error getting user purchases:', error);
    return [];
  }
};

export const getUserSales = async (userId: string): Promise<MarketplaceItem[]> => {
  try {
    const q = query(
      collection(db, 'marketplace'),
      where('sellerId', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    const sales = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      purchaseDate: doc.data().purchaseDate?.toDate ? doc.data().purchaseDate.toDate() : doc.data().purchaseDate,
      deletedAt: doc.data().deletedAt?.toDate ? doc.data().deletedAt.toDate() : doc.data().deletedAt,
      isSold: doc.data().isSold || false,
      isDeleted: doc.data().isDeleted || false
    })) as MarketplaceItem[];

    sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return sales;
  } catch (error) {
    logger.error('Error getting user sales:', error);
    return [];
  }
};

export const getTransactionHistory = async (userId: string): Promise<Array<Purchase | MarketplaceItem>> => {
  try {
    const [purchases, sales] = await Promise.all([
      getUserPurchases(userId),
      getUserSales(userId)
    ]);

    const allTransactions = [...purchases, ...sales].sort((a, b) => {
      try {
        let dateA: Date;
        let dateB: Date;

        if ('buyerId' in a) {
          dateA = a.purchaseDate instanceof Date ? a.purchaseDate : new Date(a.purchaseDate || Date.now());
        } else {
          const itemA = a as MarketplaceItem;
          if (itemA.purchaseDate) {
            dateA = itemA.purchaseDate instanceof Date ? itemA.purchaseDate : new Date(itemA.purchaseDate);
          } else if (itemA.deletedAt) {
            dateA = itemA.deletedAt instanceof Date ? itemA.deletedAt : new Date(itemA.deletedAt);
          } else {
            dateA = itemA.createdAt instanceof Date ? itemA.createdAt : new Date(itemA.createdAt || Date.now());
          }
        }

        if ('buyerId' in b) {
          dateB = b.purchaseDate instanceof Date ? b.purchaseDate : new Date(b.purchaseDate || Date.now());
        } else {
          const itemB = b as MarketplaceItem;
          if (itemB.purchaseDate) {
            dateB = itemB.purchaseDate instanceof Date ? itemB.purchaseDate : new Date(itemB.purchaseDate);
          } else if (itemB.deletedAt) {
            dateB = itemB.deletedAt instanceof Date ? itemB.deletedAt : new Date(itemB.deletedAt);
          } else {
            dateB = itemB.createdAt instanceof Date ? itemB.createdAt : new Date(itemB.createdAt || Date.now());
          }
        }

        if (!dateA || !dateB || isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }

        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        return 0;
      }
    });

    return allTransactions;
  } catch (error) {
    logger.error('Error getting transaction history:', error);
    return [];
  }
};

export const calculateUserBalance = async (userId: string): Promise<{
  totalEarned: number;
  totalSpent: number;
  balance: number;
  totalSales: number;
  totalPurchases: number;
  activeListing: number;
  deletedItems: number;
}> => {
  try {
    const [purchases, sales] = await Promise.all([
      getUserPurchases(userId),
      getUserSales(userId)
    ]);

    const soldItems = sales.filter(item => {
      return item.isSold === true;
    });

    const totalEarned = soldItems.reduce((sum, item) => {
      const price = item.price || 0;
      return sum + price;
    }, 0);

    const totalSpent = purchases.reduce((sum, purchase) => {
      let price = 0;

      if (purchase.price && purchase.price > 0) {
        price = purchase.price;
      } else if (purchase.itemData?.price && purchase.itemData.price > 0) {
        price = purchase.itemData.price;
      }

      return sum + price;
    }, 0);

    const totalSales = soldItems.length;
    const totalPurchases = purchases.length;
    const activeListing = sales.filter(item => !item.isSold && !item.isDeleted).length;
    const deletedItems = sales.filter(item => item.isDeleted === true).length;

    const balance = totalEarned - totalSpent;

    return {
      totalEarned,
      totalSpent,
      balance,
      totalSales,
      totalPurchases,
      activeListing,
      deletedItems
    };
  } catch (error) {
    return {
      totalEarned: 0,
      totalSpent: 0,
      balance: 0,
      totalSales: 0,
      totalPurchases: 0,
      activeListing: 0,
      deletedItems: 0
    };
  }
};

export const loadUserTransactions = async (userId: string): Promise<Array<Purchase | MarketplaceItem>> => {
  try {
    const transactions = await getTransactionHistory(userId);
    return transactions;
  } catch (error) {
    logger.error('Error in loadUserTransactions:', error);
    throw new Error('Impossible de charger les transactions utilisateur');
  }
};

export const getBoughtItems = async (userId: string): Promise<Purchase[]> => {
  return getUserPurchases(userId);
};

export const loadMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
  return getMarketplaceItems();
};

export const addItem = async (
  item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'imageUrl'>,
  imageUri: string = ''
): Promise<boolean> => {
  try {
    await addMarketplaceItem(item, imageUri);
    return true;
  } catch (error) {
    logger.error('Error in addItem:', error);
    return false;
  }
};

export const deleteItem = async (itemId: string): Promise<boolean> => {
  try {
    await deleteMarketplaceItem(itemId);
    return true;
  } catch (error) {
    logger.error('Error in deleteItem:', error);
    return false;
  }
};

export const getUserStats = async (userId: string) => {
  try {
    const stats = await calculateUserBalance(userId);
    return {
      ...stats,
      netBalance: stats.balance,
      activeListings: stats.activeListing
    };
  } catch (error) {
    logger.error('Error getting user stats:', error);
    throw error;
  }
};

export const pickImage = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Toast.show({
      type: 'error',
      text1: 'Permission refusée',
      text2: 'Nous avons besoin de la permission pour accéder à vos photos.',
      position: 'bottom',
    });
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }
  return null;
};

export const validateMarketplaceItem = (item: Partial<MarketplaceItem>): string[] => {
  const errors: string[] = [];

  if (!item.title || item.title.trim().length < 3) {
    errors.push('Le titre doit contenir au moins 3 caractères');
  }

  if (!item.description || item.description.trim().length < 10) {
    errors.push('La description doit contenir au moins 10 caractères');
  }

  if (!item.price || item.price <= 0) {
    errors.push('Le prix doit être supérieur à 0');
  }

  if (item.price && item.price > 10000) {
    errors.push('Le prix ne peut pas dépasser 10 000€');
  }

  if (!item.sellerId || !item.sellerName) {
    errors.push('Informations vendeur manquantes');
  }

  return errors;
};

export default {
  getMarketplaceItems,
  getAllMarketplaceItems,
  addMarketplaceItem,
  deleteMarketplaceItem,
  permanentDeleteMarketplaceItem,
  purchaseItem,
  recordPurchase,
  getUserPurchases,
  getUserSales,
  getTransactionHistory,
  calculateUserBalance,
  loadUserTransactions,
  getBoughtItems,
  loadMarketplaceItems,
  addItem,
  deleteItem,
  getUserStats,
  pickImage,
  validateMarketplaceItem
};