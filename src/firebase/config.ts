
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if the config is populated with actual values
const isConfigValid = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');

// Initialize Firebase only if the config is valid
const app = !getApps().length && isConfigValid ? initializeApp(firebaseConfig) : (getApps()[0] || null);

export { app, firebaseConfig, isConfigValid };
