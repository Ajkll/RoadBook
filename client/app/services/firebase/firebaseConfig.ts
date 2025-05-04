// app/services/firebase/firebaseConfig.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

console.log('✅ Initialisation de Firebase - Début');

const firebaseConfig = {
  apiKey: 'AIzaSyBWN9S1okxnIkxAmmqiu5LmkKsX6956lDs',
  authDomain: 'roadbook-5c1ad.firebaseapp.com',
  projectId: 'roadbook-5c1ad',
  storageBucket: 'roadbook-5c1ad.appspot.com',
  messagingSenderId: '861432841004',
  appId: '1:861432841004:web:25da6c059f5e564f476289',
  measurementId: 'G-TPBQCVKT71',
};

// Initialise Firebase si pas encore fait
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const db = getFirestore(app);

console.log('✅ Firestore initialisé avec succès');

export { db };
