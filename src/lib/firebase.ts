import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAPUY42Bm67ROhPQZmg_m9qNShSxrO2AWY",
  authDomain: "eres-clave.firebaseapp.com",
  projectId: "eres-clave",
  storageBucket: "eres-clave.firebasestorage.app",
  messagingSenderId: "704063877107",
  appId: "1:704063877107:web:5e4f70c90d93cf0c21ec86",
  measurementId: "G-JJQ8VHEE66",
};

// Avoid duplicate initialization during SSR/HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only in browser
if (typeof window !== "undefined") {
  isSupported().then((ok) => {
    if (ok) getAnalytics(app);
  });
}

export default app;
