import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Data Services
export async function getHotelById(hotelId) {
  if (!hotelId) throw new Error("ID de hotel no proporcionado");
  const docSnap = await getDoc(doc(db, "hotels", hotelId));
  if (!docSnap.exists()) {
    throw new Error("Este hotel no existe en nuestra base de datos");
  }
  return { ...docSnap.data(), id: docSnap.id };
}

export async function getSharedItinerary(itineraryId) {
  const itSnap = await getDoc(doc(db, "shared_itineraries", itineraryId));
  if (!itSnap.exists()) {
    throw new Error("El enlace compartido ha expirado.");
  }
  return itSnap.data();
}

export async function saveSharedItinerary(payload) {
  const docRef = await addDoc(collection(db, "shared_itineraries"), {
    ...payload,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}
