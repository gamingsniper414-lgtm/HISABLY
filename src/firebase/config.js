import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGgl8RwwvCRf2keV_T4NX6j1fwWA9hmQg",
  authDomain: "hisably-c9e00.firebaseapp.com",
  projectId: "hisably-c9e00",
  storageBucket: "hisably-c9e00.firebasestorage.app",
  messagingSenderId: "414016650132",
  appId: "1:414016650132:web:acf4cf737a671e90b4ad81",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);