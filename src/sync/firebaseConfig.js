// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnlA_7MvMdAnFMJkcrC1rlSEEEkn43c5o",
  authDomain: "rallydink-8bd5d.firebaseapp.com",
  projectId: "rallydink-8bd5d",
  storageBucket: "rallydink-8bd5d.firebasestorage.app",
  messagingSenderId: "147228865456",
  appId: "1:147228865456:web:fd0519b73232777d429c75",
  measurementId: "G-7YZP38Y1VH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);