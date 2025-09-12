// lib/firebaseClient.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // NOTE: default is usually "<project-id>.appspot.com"
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Avoid re-initializing on hot reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Only touch Auth persistence in the browser
let auth;
if (typeof window !== "undefined") {
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Error setting persistence:", err);
  });
}

const db = getFirestore(app);
const storage = getStorage(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export { app, auth, db, storage, provider };

