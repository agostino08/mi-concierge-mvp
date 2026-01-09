// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE (Lo que copiaste de la consola)
const firebaseConfig = {
  apiKey: "AIzaSyAX5j_u0899WqO5fIkrau2xECGqSWQUpRY",
  authDomain: "conciergefy-ceb0f.firebaseapp.com",
  projectId: "conciergefy-ceb0f",
  storageBucket: "conciergefy-ceb0f.firebasestorage.app",
  messagingSenderId: "299146134024",
  appId: "1:299146134024:web:396d841731582ba49007bd",
  measurementId: "G-VXC8VYTZZG",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
