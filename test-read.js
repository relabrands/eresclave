import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

async function test() {
  const snap = await getDoc(doc(db, "users", "FJpyhpWvp4hrM7xia5CsyjGcigB3"));
  console.log("Exists:", snap.exists());
  const data = snap.data();
  console.log("Data:", data);
  if (data) {
    console.log("Role string length:", data.role.length);
    console.log("Role exactly matches 'admin':", data.role === "admin");
  }
  process.exit(0);
}

test().catch(console.error);
