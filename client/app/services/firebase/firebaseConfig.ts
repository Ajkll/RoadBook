// app/services/firebase/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { ENV } from '../config/env';

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: 'roadbook-5c1ad',
  storageBucket: 'roadbook-5c1ad.appspot.com',
  messagingSenderId: '861432841004',
  appId: ENV.FIREBASE_APP_ID,
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