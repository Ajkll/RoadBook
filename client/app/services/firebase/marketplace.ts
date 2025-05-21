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
  serverTimestamp
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { logger } from '../../utils/logger';

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerName: string;
  sellerId: string;
  imageUrl: string;
  createdAt: Date;
  isSold?: boolean;
  buyerId?: string;
  purchaseDate?: Date;
}

export interface Purchase {
  id: string;
  itemId: string;
  buyerId: string;
  price: number;
  buyerName: string;
  purchaseDate: Date;
  itemData?: MarketplaceItem; // Pour stocker les données complètes de l'article
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

// Fonctions existantes inchangées
export const getMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'marketplace'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as MarketplaceItem[];
  } catch (error) {
    logger.error('Error getting marketplace items:', error);
    return [];
  }
};

export const addMarketplaceItem = async (
  item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'imageUrl'>,
  imageUri: string
): Promise<void> => {
  try {
    let imageUrl = '';
    if (imageUri) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `marketplace/${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, blob);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    await addDoc(collection(db, 'marketplace'), {
      ...item,
      imageUrl,
      createdAt: new Date(),
      isSold: false,
    });
  } catch (error) {
    logger.error('Error adding marketplace item:', error);
    throw error;
  }
};

// Nouvelles fonctions pour gérer les transactions
export const purchaseItem = async (itemId: string, buyerId: string) => {
  const db = getFirestore();
  const batch = writeBatch(db);

  const itemRef = doc(db, 'marketplace', itemId);
  const itemSnap = await getDoc(itemRef);

  if (!itemSnap.exists()) throw new Error("Item doesn't exist");
  if (itemSnap.data().sellerId === buyerId) throw new Error("Cannot buy your own item");

  // Créer la transaction
  const transactionRef = doc(collection(db, 'transactions'));
  batch.set(transactionRef, {
    itemId,
    sellerId: itemSnap.data().sellerId,
    buyerId,
    amount: itemSnap.data().price,
    status: 'completed',
    createdAt: serverTimestamp()
  });

  // Marquer l'article comme vendu
  batch.update(itemRef, {
    isSold: true,
    buyerId,
    purchaseDate: serverTimestamp()
  });

  await batch.commit();
  return { success: true };
};

export const getSellableItems = async (): Promise<MarketplaceItem[]> => {
  try {
    const q = query(
      collection(db, 'marketplace'),
      where('isSold', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as MarketplaceItem[];
  } catch (error) {
    logger.error('Error getting sellable items:', error);
    return [];
  }
};

export const recordPurchase = async (
  itemId: string,
  buyerId: string,
  buyerName: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'purchases'), {
      itemId,
      buyerId,
      buyerName,
      purchaseDate: new Date(),
    });
  } catch (error) {
    logger.error('Error recording purchase:', error);
    throw error;
  }
};

export const getUserPurchases = async (userId: string): Promise<Purchase[]> => {
  try {
    const q = query(collection(db, 'purchases'), where('buyerId', '==', userId));
    const querySnapshot = await getDocs(q);

    const purchases = await Promise.all(
      querySnapshot.docs.map(async doc => {
        const data = doc.data();
        // Récupérer les détails de l'article
        const itemDoc = await getDoc(doc(db, 'marketplace', data.itemId));
        const itemData = itemDoc.exists() ? {
          ...itemDoc.data(),
          id: itemDoc.id,
          createdAt: itemDoc.data().createdAt.toDate(),
        } as MarketplaceItem : undefined;

        return {
          id: doc.id,
          ...data,
          purchaseDate: data.purchaseDate.toDate(),
          itemData,
        } as Purchase;
      })
    );

    return purchases;
  } catch (error) {
    logger.error('Error getting user purchases:', error);
    return [];
  }
};

export const getUserSales = async (userId: string): Promise<MarketplaceItem[]> => {
  try {
    const q = query(collection(db, 'marketplace'), where('sellerId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as MarketplaceItem[];
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

    // Combiner et trier par date
    return [...purchases, ...sales].sort((a, b) => {
      const dateA = 'purchaseDate' in a ? a.purchaseDate : a.createdAt;
      const dateB = 'purchaseDate' in b ? b.purchaseDate : b.createdAt;
      return dateB.getTime() - dateA.getTime(); // Tri décroissant
    });
  } catch (error) {
    logger.error('Error getting transaction history:', error);
    return [];
  }
};

// Fonction existante pour la sélection d'image
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