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
  deleteDoc
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

// ===== FONCTION PRINCIPALE CORRIGÉE =====

export const getMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
  try {
    console.log('📦 Chargement des articles marketplace...');
    const querySnapshot = await getDocs(collection(db, 'marketplace'));

    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const item = {
        id: doc.id, // IMPORTANT: l'ID du document Firestore
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      } as MarketplaceItem;

      // Debug pour chaque article
      console.log('📄 Article chargé:', {
        id: item.id,
        title: item.title,
        hasId: !!item.id,
        sellerId: item.sellerId
      });

      // Vérification de l'intégrité
      if (!item.id) {
        console.error('❌ Article sans ID détecté:', data);
      }

      return item;
    });

    console.log(`✅ ${items.length} articles chargés`);

    // Statistiques de diagnostic
    const itemsWithId = items.filter(item => item.id && item.id !== '');
    const itemsWithoutId = items.filter(item => !item.id || item.id === '');

    console.log(`📊 Statistiques: ${itemsWithId.length} avec ID, ${itemsWithoutId.length} sans ID`);

    if (itemsWithoutId.length > 0) {
      console.warn('⚠️ Articles sans ID:', itemsWithoutId);
    }

    return items;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des articles:', error);
    logger.error('Error getting marketplace items:', error);
    return [];
  }
};

export const addMarketplaceItem = async (
  item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'imageUrl'>,
  imageUri: string = ''
): Promise<void> => {
  try {
    console.log('➕ Ajout d\'un nouvel article...', item);

    let imageUrl = '';
    if (imageUri) {
      console.log('📸 Upload de l\'image...');
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `marketplace/${Date.now()}_${Math.random().toString(36).substring(7)}`);
      const snapshot = await uploadBytes(storageRef, blob);
      imageUrl = await getDownloadURL(snapshot.ref);
      console.log('✅ Image uploadée:', imageUrl);
    }

    const itemData = {
      ...item,
      imageUrl,
      createdAt: new Date(),
      isSold: false,
    };

    console.log('💾 Sauvegarde en Firestore...', itemData);
    const docRef = await addDoc(collection(db, 'marketplace'), itemData);
    console.log('✅ Article ajouté avec ID:', docRef.id);

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout:', error);
    logger.error('Error adding marketplace item:', error);
    throw error;
  }
};

export const deleteMarketplaceItem = async (itemId: string): Promise<void> => {
  try {
    if (!itemId || itemId === '') {
      throw new Error('ID de l\'article manquant pour la suppression');
    }

    console.log('🗑️ Suppression de l\'article:', itemId);
    await deleteDoc(doc(db, 'marketplace', itemId));
    console.log('✅ Article supprimé avec succès');
    logger.info('Marketplace item deleted successfully:', itemId);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    logger.error('Error deleting marketplace item:', error);
    throw error;
  }
};

// ===== FONCTIONS DE TRANSACTION =====

export const purchaseItem = async (itemId: string, buyerId: string) => {
  try {
    if (!itemId || itemId === '') {
      throw new Error('ID de l\'article manquant pour l\'achat');
    }

    if (!buyerId || buyerId === '') {
      throw new Error('ID de l\'acheteur manquant');
    }

    console.log('💳 Traitement de l\'achat:', { itemId, buyerId });

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

    if (itemData.sellerId === buyerId) {
      throw new Error("Vous ne pouvez pas acheter votre propre article");
    }

    // Créer la transaction
    const transactionRef = doc(collection(db, 'transactions'));
    batch.set(transactionRef, {
      itemId,
      sellerId: itemData.sellerId,
      buyerId,
      amount: itemData.price,
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
    console.log('✅ Achat traité avec succès');

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de l\'achat:', error);
    throw error;
  }
};

export const recordPurchase = async (
  itemId: string,
  buyerId: string,
  buyerName: string
): Promise<void> => {
  try {
    // ✅ CORRECTION: Vérification stricte de l'itemId
    if (!itemId || itemId === '' || typeof itemId !== 'string') {
      throw new Error('ID de l\'article manquant ou invalide pour l\'enregistrement');
    }

    if (!buyerId || buyerId === '' || typeof buyerId !== 'string') {
      throw new Error('ID de l\'acheteur manquant ou invalide');
    }

    console.log('📝 Enregistrement de l\'achat:', { itemId, buyerId, buyerName });

    await addDoc(collection(db, 'purchases'), {
      itemId, // ✅ Validé au préalable
      buyerId,
      buyerName,
      purchaseDate: new Date(),
    });

    console.log('✅ Achat enregistré');
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement:', error);
    logger.error('Error recording purchase:', error);
    throw error;
  }
};

// ===== FONCTIONS DE RÉCUPÉRATION =====

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
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
    })) as MarketplaceItem[];
  } catch (error) {
    logger.error('Error getting sellable items:', error);
    return [];
  }
};

// ✅ FONCTION PRINCIPALE CORRIGÉE
export const getUserPurchases = async (userId: string): Promise<Purchase[]> => {
  try {
    console.log('🛒 Récupération des achats pour l\'utilisateur:', userId);

    const q = query(collection(db, 'purchases'), where('buyerId', '==', userId));
    const querySnapshot = await getDocs(q);

    console.log(`📊 ${querySnapshot.docs.length} achats trouvés`);

    const purchases = await Promise.all(
      querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();

        console.log('🔍 Traitement de l\'achat:', {
          purchaseId: docSnapshot.id,
          itemId: data.itemId,
          itemIdType: typeof data.itemId,
          hasItemId: !!data.itemId
        });

        // ✅ CORRECTION: Vérifier que itemId existe et est valide
        let itemData: MarketplaceItem | undefined;

        if (data.itemId && typeof data.itemId === 'string' && data.itemId.trim() !== '') {
          try {
            console.log('📄 Récupération de l\'article:', data.itemId);
            const itemDoc = await getDoc(doc(db, 'marketplace', data.itemId));

            if (itemDoc.exists()) {
              itemData = {
                id: itemDoc.id,
                ...itemDoc.data(),
                createdAt: itemDoc.data().createdAt?.toDate ? itemDoc.data().createdAt.toDate() : new Date(itemDoc.data().createdAt),
              } as MarketplaceItem;
              console.log('✅ Article récupéré:', itemData.title);
            } else {
              console.warn('⚠️ Article non trouvé dans la base:', data.itemId);
            }
          } catch (itemError) {
            console.error('❌ Erreur lors de la récupération de l\'article:', data.itemId, itemError);
          }
        } else {
          console.warn('⚠️ itemId manquant ou invalide pour l\'achat:', {
            purchaseId: docSnapshot.id,
            itemId: data.itemId,
            allFields: Object.keys(data)
          });
        }

        return {
          id: docSnapshot.id,
          itemId: data.itemId || '', // ✅ Valeur par défaut
          buyerId: data.buyerId,
          price: data.price || 0,
          buyerName: data.buyerName,
          purchaseDate: data.purchaseDate?.toDate ? data.purchaseDate.toDate() : new Date(data.purchaseDate),
          itemData,
        } as Purchase;
      })
    );

    console.log(`✅ ${purchases.length} achats traités`);
    return purchases;
  } catch (error) {
    console.error('❌ Erreur dans getUserPurchases:', error);
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

    return querySnapshot.docs.map(doc => ({
      id: doc.id, // Assurez-vous que l'ID est bien défini
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
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

// ===== FONCTIONS DE COMPATIBILITÉ =====

export const loadUserTransactions = async (userId: string): Promise<Array<Purchase | MarketplaceItem>> => {
  try {
    console.log('📊 Chargement des transactions pour:', userId);
    const transactions = await getTransactionHistory(userId);
    console.log(`✅ ${transactions.length} transactions chargées`);
    return transactions;
  } catch (error) {
    console.error('❌ Erreur chargement transactions:', error);
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

// ===== FONCTIONS UTILITAIRES =====

export const getUserStats = async (userId: string) => {
  try {
    const [purchases, sales] = await Promise.all([
      getUserPurchases(userId),
      getUserSales(userId)
    ]);

    const totalPurchases = purchases.length;
    const totalSales = sales.filter(item => item.isSold).length;
    const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.itemData?.price || 0), 0);
    const totalEarned = sales
      .filter(item => item.isSold)
      .reduce((sum, item) => sum + item.price, 0);

    return {
      totalPurchases,
      totalSales,
      totalSpent,
      totalEarned,
      netBalance: totalEarned - totalSpent,
      activeListings: sales.filter(item => !item.isSold).length
    };
  } catch (error) {
    logger.error('Error getting user stats:', error);
    throw error;
  }
};

// ===== FONCTIONS DE DIAGNOSTIC =====

// ✅ NOUVELLE FONCTION DE DEBUG
export const debugPurchases = async (userId: string) => {
  try {
    console.log('🔍 Debug des achats pour:', userId);
    const q = query(collection(db, 'purchases'), where('buyerId', '==', userId));
    const querySnapshot = await getDocs(q);

    console.log(`📊 ${querySnapshot.docs.length} achats trouvés`);

    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Achat ${index + 1}:`, {
        id: doc.id,
        itemId: data.itemId,
        itemIdType: typeof data.itemId,
        itemIdLength: data.itemId?.length || 0,
        hasItemId: !!data.itemId,
        allFields: Object.keys(data),
        buyerId: data.buyerId,
        buyerName: data.buyerName
      });
    });
  } catch (error) {
    console.error('❌ Erreur debug:', error);
  }
};

export const diagnoseMarketplaceData = async () => {
  try {
    console.log('🩺 Diagnostic des données marketplace...');

    const items = await getMarketplaceItems();
    console.log(`📊 Total d'articles: ${items.length}`);

    const stats = {
      withId: 0,
      withoutId: 0,
      emptyId: 0,
      nullId: 0,
      undefinedId: 0
    };

    items.forEach(item => {
      if (item.id && item.id !== '') {
        stats.withId++;
      } else if (item.id === '') {
        stats.emptyId++;
      } else if (item.id === null) {
        stats.nullId++;
      } else if (item.id === undefined) {
        stats.undefinedId++;
      } else {
        stats.withoutId++;
      }
    });

    console.log('📈 Statistiques des IDs:', stats);

    // Afficher quelques exemples
    items.slice(0, 3).forEach((item, index) => {
      console.log(`🔍 Exemple ${index + 1}:`, {
        id: item.id,
        title: item.title,
        sellerId: item.sellerId,
        hasValidId: !!(item.id && item.id !== ''),
        idLength: item.id?.length || 0
      });
    });

    return stats;
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return null;
  }
};

export const createDemoData = async (userId: string, userName: string) => {
  try {
    console.log('🎭 Création de données de démonstration...');

    const demoItems = [
      {
        title: 'Livre de programmation React',
        description: 'Excellent livre pour apprendre React Native, en très bon état',
        price: 25.99,
        sellerName: userName,
        sellerId: userId,
      },
      {
        title: 'Casque audio Bluetooth',
        description: 'Casque sans fil de bonne qualité, autonomie 20h',
        price: 45.00,
        sellerName: userName,
        sellerId: userId,
      }
    ];

    for (const item of demoItems) {
      await addMarketplaceItem(item);
    }

    console.log('✅ Données de démonstration créées');
  } catch (error) {
    console.error('❌ Erreur création données démo:', error);
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
  addMarketplaceItem,
  deleteMarketplaceItem,
  purchaseItem,
  recordPurchase,
  getUserPurchases,
  getUserSales,
  getTransactionHistory,
  loadUserTransactions,
  getBoughtItems,
  loadMarketplaceItems,
  addItem,
  deleteItem,
  getUserStats,
  debugPurchases, // ✅ NOUVELLE FONCTION
  diagnoseMarketplaceData,
  createDemoData,
  pickImage,
  validateMarketplaceItem
};