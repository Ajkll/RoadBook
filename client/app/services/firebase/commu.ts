import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const getDocsFromCommunity = async () => {
  const snapshot = await getDocs(collection(db, 'community'));
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      pseudo: data.pseudo || '',
      pdp: data.pdp || '',
      bio: data.bio || '',
      texte: data.texte || '', // Si tu veux afficher "bio" comme texte par défaut
      publication: data.publication || '',
      backgroundImage: data.backgroundImage || '',
      followers: data.followers || 0,
    };
  });
};
