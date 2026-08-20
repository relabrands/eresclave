import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPUY42Bm67ROhPQZmg_m9qNShSxrO2AWY",
  authDomain: "eres-clave.firebaseapp.com",
  projectId: "eres-clave",
  storageBucket: "eres-clave.firebasestorage.app",
  messagingSenderId: "704063877107",
  appId: "1:704063877107:web:5e4f70c90d93cf0c21ec86",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  await setDoc(doc(db, "users", "7EDbPJAUB6QxGjX3BBu6tRWH37g1"), {
    role: "admin",
    email: "robinsonantsanchez@gmail.com"
  }, { merge: true });
  console.log("Admin role granted to 7EDbPJAUB6QxGjX3BBu6tRWH37g1");
  process.exit(0);
}

run().catch(console.error);
