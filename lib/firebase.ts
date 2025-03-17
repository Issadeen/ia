import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to local to prevent being logged out on page refresh
if (typeof window !== 'undefined') {
  // Immediately set persistence when the file loads
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
    
  // Check if there's a stored user session that needs restoration
  const savedUser = localStorage.getItem('authUser');
  if (savedUser) {
    try {
      // Just trigger auth state check
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          console.log("Attempting to restore session...");
        }
      });
    } catch (e) {
      console.error('Error restoring auth session:', e);
    }
  }
}

// Only import getStorage when needed
// to prevent unwanted CORS requests
const getStorageInstance = () => {
  const { getStorage } = require("firebase/storage");
  return getStorage(app);
};

// Connect to emulators if in development environment
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    console.log('Using Firebase emulators in development');
    // Uncomment these if you're using emulators locally
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectStorageEmulator(storage, 'localhost', 9199);
  }
}

export { app, auth, db, getStorageInstance };
