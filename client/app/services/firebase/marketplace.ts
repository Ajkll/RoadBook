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
  isDeleted?: boolean; // Nouveau champ pour la suppression logique
  deletedAt?: Date;    // Date de suppression
  status?: 'active' | 'sold' | 'deleted'; // Statut de l'article
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
    
    // CORRECTION: Firestore ne permet pas plus d'un '!=' par requête
    // On récupère tout et on filtre côté client
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
        // Valeurs par défaut pour éviter les erreurs
        isSold: data.isSold || false,
        isDeleted: data.isDeleted || false
      } as MarketplaceItem;

      // Debug de chaque article
      console.log('📄 Article:', {
        id: item.id,
        title: item.title,
        isSold: item.isSold,
        isDeleted: item.isDeleted,
        sellerId: item.sellerId,
        price: item.price
      });

      return item;
    })
    // FILTRAGE CÔTÉ CLIENT pour articles actifs seulement
    .filter(item => {
      const isAvailable = !item.isSold && !item.isDeleted;
      if (!isAvailable) {
        console.log(`❌ Article filtré: ${item.title} (sold: ${item.isSold}, deleted: ${item.isDeleted})`);
      }
      return isAvailable;
    });

    console.log(`✅ ${items.length} articles actifs chargés sur ${querySnapshot.docs.length} total`);
    return items;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des articles:', error);
    logger.error('Error getting marketplace items:', error);
    return [];
  }
};

// Nouvelle fonction pour récupérer TOUS les articles (pour l'historique)
export const getAllMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
  try {
    console.log('📦 Chargement de TOUS les articles...');
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

    console.log(`✅ ${items.length} articles totaux chargés`);
    return items;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de tous les articles:', error);
    return [];
  }
};

export const addMarketplaceItem = async (
  item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'imageUrl'>,
  imageUri: string = ''
): Promise<void> => {
  try {
    console.log('➕ Service: Ajout d\'un nouvel article...');
    console.log('📋 Service: Données reçues:', {
      title: item.title,
      description: item.description,
      price: item.price,
      sellerName: item.sellerName,
      sellerId: item.sellerId,
      imageUri: imageUri ? 'Image fournie' : 'Pas d\'image'
    });

    let imageUrl = '';
    if (imageUri) {
      console.log('📸 Service: Upload de l\'image...');
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `marketplace/${Date.now()}_${Math.random().toString(36).substring(7)}`);
        const snapshot = await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(snapshot.ref);
        console.log('✅ Service: Image uploadée:', imageUrl);
      } catch (imageError) {
        console.error('❌ Service: Erreur upload image:', imageError);
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

    console.log('💾 Service: Sauvegarde en Firestore...');
    console.log('📦 Service: Données à sauvegarder:', itemData);

    const docRef = await addDoc(collection(db, 'marketplace'), itemData);
    console.log('✅ Service: Article ajouté avec ID:', docRef.id);

  } catch (error) {
    console.error('❌ Service: Erreur lors de l\'ajout:', error);
    console.error('❌ Service: Détails de l\'erreur:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    logger.error('Error adding marketplace item:', error);
    throw error;
  }
};

// Suppression logique (marquer comme supprimé)
export const deleteMarketplaceItem = async (itemId: string): Promise<void> => {
  try {
    if (!itemId || itemId === '') {
      throw new Error('ID de l\'article manquant pour la suppression');
    }

    console.log('🗑️ Suppression logique de l\'article:', itemId);

    const itemRef = doc(db, 'marketplace', itemId);
    await updateDoc(itemRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      status: 'deleted'
    });

    console.log('✅ Article marqué comme supprimé');
    logger.info('Marketplace item marked as deleted:', itemId);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    logger.error('Error deleting marketplace item:', error);
    throw error;
  }
};

// Suppression physique (vraiment supprimer de la DB)
export const permanentDeleteMarketplaceItem = async (itemId: string): Promise<void> => {
  try {
    if (!itemId || itemId === '') {
      throw new Error('ID de l\'article manquant pour la suppression');
    }

    console.log('💀 Suppression définitive de l\'article:', itemId);
    await deleteDoc(doc(db, 'marketplace', itemId));
    console.log('✅ Article supprimé définitivement');
    logger.info('Marketplace item permanently deleted:', itemId);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression définitive:', error);
    logger.error('Error permanently deleting marketplace item:', error);
    throw error;
  }
};

// ===== FONCTIONS DE TRANSACTION =====

export const purchaseItem = async (itemId: string, buyerId: string, buyerName: string = '') => {
  try {
    if (!itemId || itemId === '') {
      throw new Error('ID de l\'article manquant pour l\'achat');
    }

    if (!buyerId || buyerId === '') {
      throw new Error('ID de l\'acheteur manquant');
    }

    console.log('💳 Traitement de l\'achat:', { itemId, buyerId, buyerName });

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
      buyerName,
      purchaseDate: serverTimestamp(),
      status: 'sold'
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
    if (!itemId || itemId === '' || typeof itemId !== 'string') {
      throw new Error('ID de l\'article manquant ou invalide pour l\'enregistrement');
    }

    if (!buyerId || buyerId === '' || typeof buyerId !== 'string') {
      throw new Error('ID de l\'acheteur manquant ou invalide');
    }

    console.log('📝 Enregistrement de l\'achat:', { itemId, buyerId, buyerName });

    await addDoc(collection(db, 'purchases'), {
      itemId,
      buyerId,
      buyerName,
      purchaseDate: serverTimestamp(),
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
    // CORRECTION: Éviter multiple '!=' filters
    const q = query(collection(db, 'marketplace'));
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      isSold: doc.data().isSold || false,
      isDeleted: doc.data().isDeleted || false
    })) as MarketplaceItem[];

    // Filtrage côté client
    return items.filter(item => !item.isSold && !item.isDeleted);
  } catch (error) {
    logger.error('Error getting sellable items:', error);
    return [];
  }
};

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
          hasItemId: !!data.itemId,
          buyerId: data.buyerId,
          price: data.price
        });

        let itemData: MarketplaceItem | undefined;

        if (data.itemId && typeof data.itemId === 'string' && data.itemId.trim() !== '') {
          try {
            console.log('📄 Récupération de l\'article:', data.itemId);
            const itemDoc = await getDoc(doc(db, 'marketplace', data.itemId));

            if (itemDoc.exists()) {
              const itemDocData = itemDoc.data();
              itemData = {
                id: itemDoc.id,
                ...itemDocData,
                createdAt: itemDocData.createdAt?.toDate ? itemDocData.createdAt.toDate() : new Date(itemDocData.createdAt),
                // Assurer que les propriétés existent
                title: itemDocData.title || 'Article sans titre',
                price: itemDocData.price || 0,
                sellerName: itemDocData.sellerName || 'Vendeur inconnu',
                description: itemDocData.description || '',
                isSold: itemDocData.isSold || false,
                isDeleted: itemDocData.isDeleted || false
              } as MarketplaceItem;
              console.log('✅ Article récupéré:', itemData.title, `Prix: €${itemData.price}`);
            } else {
              console.warn('⚠️ Article non trouvé dans la base:', data.itemId);
              // Créer un objet article minimal avec les données disponibles
              itemData = {
                id: data.itemId,
                title: 'Article supprimé',
                price: data.price || 0,
                sellerName: 'Vendeur inconnu',
                description: 'Cet article n\'existe plus',
                sellerId: '',
                imageUrl: '',
                createdAt: new Date(),
                isSold: true,
                isDeleted: true
              } as MarketplaceItem;
            }
          } catch (itemError) {
            console.error('❌ Erreur lors de la récupération de l\'article:', data.itemId, itemError);
            // Créer un objet article d'erreur
            itemData = {
              id: data.itemId || 'unknown',
              title: 'Erreur de chargement',
              price: data.price || 0,
              sellerName: 'Vendeur inconnu',
              description: 'Impossible de charger les détails',
              sellerId: '',
              imageUrl: '',
              createdAt: new Date(),
              isSold: true,
              isDeleted: true
            } as MarketplaceItem;
          }
        } else {
          console.warn('⚠️ itemId manquant ou invalide pour l\'achat:', {
            purchaseId: docSnapshot.id,
            itemId: data.itemId,
            allFields: Object.keys(data)
          });
          // Créer un objet article minimal
          itemData = {
            id: 'unknown',
            title: 'Article sans ID',
            price: data.price || 0,
            sellerName: 'Vendeur inconnu',
            description: 'Article sans identifiant',
            sellerId: '',
            imageUrl: '',
            createdAt: new Date(),
            isSold: true,
            isDeleted: true
          } as MarketplaceItem;
        }

        const purchase: Purchase = {
          id: docSnapshot.id,
          itemId: data.itemId || '',
          buyerId: data.buyerId,
          price: data.price || itemData.price || 0, // Utiliser le prix de l'achat ou de l'article
          buyerName: data.buyerName,
          purchaseDate: data.purchaseDate?.toDate ? data.purchaseDate.toDate() : new Date(data.purchaseDate),
          itemData,
        };

        console.log('📦 Achat traité:', {
          id: purchase.id,
          title: purchase.itemData?.title,
          price: purchase.price,
          date: purchase.purchaseDate
        });

        return purchase;
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
    console.log('💰 Récupération des ventes pour l\'utilisateur:', userId);

    // CORRECTION: Supprimer orderBy pour éviter l'erreur d'index
    // L'index sellerId + createdAt n'existe pas encore
    const q = query(
      collection(db, 'marketplace'),
      where('sellerId', '==', userId)
      // Temporairement supprimé: orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const sales = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      purchaseDate: doc.data().purchaseDate?.toDate ? doc.data().purchaseDate.toDate() : doc.data().purchaseDate,
      deletedAt: doc.data().deletedAt?.toDate ? doc.data().deletedAt.toDate() : doc.data().deletedAt,
      // Valeurs par défaut
      isSold: doc.data().isSold || false,
      isDeleted: doc.data().isDeleted || false
    })) as MarketplaceItem[];

    // Tri côté client par date de création (plus récent en premier)
    sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log(`✅ ${sales.length} ventes récupérées`);
    return sales;
  } catch (error) {
    logger.error('Error getting user sales:', error);
    return [];
  }
};

export const getTransactionHistory = async (userId: string): Promise<Array<Purchase | MarketplaceItem>> => {
  try {
    console.log('📊 Récupération de l\'historique complet pour:', userId);

    const [purchases, sales] = await Promise.all([
      getUserPurchases(userId),
      getUserSales(userId)
    ]);

    console.log(`📈 Historique: ${purchases.length} achats, ${sales.length} ventes`);

    // Combiner et trier par date - CORRECTION DE L'ERREUR getTime
    const allTransactions = [...purchases, ...sales].sort((a, b) => {
      try {
        // Gestion sécurisée des dates
        let dateA: Date;
        let dateB: Date;

        // Pour les achats (Purchase)
        if ('buyerId' in a) {
          dateA = a.purchaseDate instanceof Date ? a.purchaseDate : new Date(a.purchaseDate || Date.now());
        } else {
          // Pour les ventes (MarketplaceItem)
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

        // Vérification de sécurité
        if (!dateA || !dateB || isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.warn('⚠️ Date invalide détectée:', {
            dateA: dateA?.toString(),
            dateB: dateB?.toString(),
            itemA: 'buyerId' in a ? a.id : (a as MarketplaceItem).id,
            itemB: 'buyerId' in b ? b.id : (b as MarketplaceItem).id
          });
          return 0; // Garder l'ordre original si dates invalides
        }

        return dateB.getTime() - dateA.getTime(); // Tri décroissant
      } catch (error) {
        console.error('❌ Erreur tri transactions:', error);
        return 0; // Garder l'ordre original en cas d'erreur
      }
    });

    console.log(`✅ ${allTransactions.length} transactions triées`);
    return allTransactions;
  } catch (error) {
    console.error('❌ Erreur dans getTransactionHistory:', error);
    logger.error('Error getting transaction history:', error);
    return [];
  }
};

// ===== FONCTION DE CALCUL DE BALANCE =====

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
    console.log('💰 Calcul de la balance pour:', userId);

    const [purchases, sales] = await Promise.all([
      getUserPurchases(userId),
      getUserSales(userId)
    ]);

    console.log(`📊 Calcul balance: ${purchases.length} achats, ${sales.length} ventes`);

    // Calcul des gains (articles vendus)
    const soldItems = sales.filter(item => {
      const isSold = item.isSold === true;
      console.log(`Article ${item.id}: isSold=${isSold}, title=${item.title}`);
      return isSold;
    });

    const totalEarned = soldItems.reduce((sum, item) => {
      const price = item.price || 0;
      console.log(`Gain: ${item.title} = €${price}`);
      return sum + price;
    }, 0);

    // Calcul des dépenses (achats) - CORRECTION
    const totalSpent = purchases.reduce((sum, purchase) => {
      // Priorité: prix dans l'achat, puis prix de l'article, puis 0
      let price = 0;

      if (purchase.price && purchase.price > 0) {
        price = purchase.price;
      } else if (purchase.itemData?.price && purchase.itemData.price > 0) {
        price = purchase.itemData.price;
      }

      console.log(`Dépense: ${purchase.itemData?.title || 'Article inconnu'} = €${price}`);
      return sum + price;
    }, 0);

    // Autres statistiques
    const totalSales = soldItems.length;
    const totalPurchases = purchases.length;
    const activeListing = sales.filter(item => !item.isSold && !item.isDeleted).length;
    const deletedItems = sales.filter(item => item.isDeleted === true).length;

    const balance = totalEarned - totalSpent;

    console.log('💰 Balance calculée:', {
      totalEarned,
      totalSpent,
      balance,
      totalSales,
      totalPurchases,
      activeListing,
      deletedItems
    });

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

export const diagnoseMarketplaceData = async () => {
  try {
    console.log('🩺 Diagnostic des données marketplace...');

    const items = await getAllMarketplaceItems();
    console.log(`📊 Total d'articles: ${items.length}`);

    const stats = {
      withId: 0,
      withoutId: 0,
      emptyId: 0,
      nullId: 0,
      undefinedId: 0,
      active: 0,
      sold: 0,
      deleted: 0
    };

    items.forEach(item => {
      // Stats des IDs
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

      // Stats des statuts
      if (item.isDeleted) {
        stats.deleted++;
      } else if (item.isSold) {
        stats.sold++;
      } else {
        stats.active++;
      }
    });

    console.log('📈 Statistiques:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return null;
  }
};

// Fonctions d'images et validation restent inchangées...
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
  diagnoseMarketplaceData,
  pickImage,
  validateMarketplaceItem
};