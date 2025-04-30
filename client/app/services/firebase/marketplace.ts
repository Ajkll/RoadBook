import { storage, db } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerName: string;
  sellerId: string;
  imageUrl: string;
  createdAt: Date;
}

export const getMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'marketplace'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as MarketplaceItem[];
  } catch (error) {
    console.error('Error getting marketplace items:', error);
    return [];
  }
};

export const addMarketplaceItem = async (
  item: Omit<MarketplaceItem, 'id' | 'createdAt' | 'imageUrl'>,
  imageUri: string
): Promise<void> => {
  try {
    // Upload image to storage
    let imageUrl = '';
    if (imageUri) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `marketplace/${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, blob);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    // Add item to Firestore
    await addDoc(collection(db, 'marketplace'), {
      ...item,
      imageUrl,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error adding marketplace item:', error);
    throw error;
  }
};

export const pickImage = async (): Promise<string | null> => {
  // Demander la permission d'accéder à la galerie
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

  // Ouvrir la galerie
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