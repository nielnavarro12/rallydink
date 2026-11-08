// Import core app module
import { initializeApp } from "firebase/app";

// REQUIRED: Side-effect imports to register sub-services into core app
import "firebase/analytics";
import "firebase/firestore";

// Import SDK modules
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your Firebase web app configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCkylz_F-rBewflkwY5kKEHV-o_10kfhg8",
  authDomain: "drivendink.firebaseapp.com",
  projectId: "drivendink",
  storageBucket: "drivendink.firebasestorage.app",
  messagingSenderId: "145012106025",
  appId: "1:145012106025:web:213a3bb4fba755fef9cd38",
  measurementId: "G-2PBMYRD69W"
};

// 1. Initialize Firebase core app first
export const app = initializeApp(firebaseConfig);

// 2. Initialize and export Firestore DB instance
export const db = getFirestore(app);

// 3. Initialize Analytics safely (prevents SSR or ad-blocker crashes)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}