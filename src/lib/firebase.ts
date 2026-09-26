import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCb9KvEy6yw6L9HLmaCyJb93T3dNPCWacY",
  authDomain: "e-barangay-system-427d0.firebaseapp.com",
  projectId: "e-barangay-system-427d0",
  storageBucket: "e-barangay-system-427d0.firebasestorage.app",
  messagingSenderId: "1010877605074",
  appId: "1:1010877605074:web:f22fe43b7a66f88424390b",
  measurementId: "G-8Q0YF8T74E",
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;