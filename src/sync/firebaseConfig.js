// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCkylz_F-rBewflkwY5kKEHV-o_10kfhg8",
  authDomain: "drivendink.firebaseapp.com",
  projectId: "drivendink",
  storageBucket: "drivendink.firebasestorage.app",
  messagingSenderId: "145012106025",
  appId: "1:145012106025:web:213a3bb4fba755fef9cd38",
  measurementId: "G-2PBMYRD69W"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);