// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyBWN9S1okxnIkxAmmqiu5LmkKsX6956lDs',
  authDomain: 'roadbook-5c1ad.firebaseapp.com',
  projectId: 'roadbook-5c1ad',
  storageBucket: 'roadbook-5c1ad.firebasestorage.app',
  messagingSenderId: '861432841004',
  appId: '1:861432841004:web:25da6c059f5e564f476289',
  measurementId: 'G-TPBQCVKT71',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// to do : Mettre les sécurité firebase en place ! (IMPORTANT)
