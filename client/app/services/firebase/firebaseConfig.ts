// app/services/firebase/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBWN9S1okxnIkxAmmqiu5LmkKsX6956lDs',
  authDomain: 'roadbook-5c1ad.firebaseapp.com',
  projectId: 'roadbook-5c1ad',
  storageBucket: 'roadbook-5c1ad.appspot.com',
  messagingSenderId: '861432841004',
  appId: '1:861432841004:web:25da6c059f5e564f476289',
  measurementId: 'G-TPBQCVKT71',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings for Expo Go compatibility
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// Initialize Storage
const storage = getStorage(app);

export { app, db, storage };