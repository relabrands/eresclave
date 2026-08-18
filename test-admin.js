import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
const auth = getAuth(app);

async function test() {
  const cred = await signInWithEmailAndPassword(auth, "robinsonantsanchez@gmail.com", "Rob@12345");
  console.log("Logged in UID:", cred.user.uid);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  console.log("Exists:", snap.exists());
  console.log("Data:", snap.data());
  process.exit(0);
}

test().catch(console.error);
