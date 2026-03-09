import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, getDoc, collection, addDoc, getDocs,
  setDoc, deleteDoc, serverTimestamp, query, where
} from "firebase/firestore";

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

// ─── Guest-facing data services ───────────────────────────────────────────────

export async function getHotelById(hotelId) {
  if (!hotelId) throw new Error("Hotel ID not provided");
  const docSnap = await getDoc(doc(db, "hotels", hotelId));
  if (!docSnap.exists()) throw new Error("Hotel not found in database");
  return { ...docSnap.data(), id: docSnap.id };
}

export async function getHotelBySlug(slug) {
  if (!slug) throw new Error("Hotel slug not provided");
  const snap = await getDocs(query(collection(db, "hotels"), where("slug", "==", slug)));
  if (snap.empty) throw new Error("Hotel not found in database");
  return { ...snap.docs[0].data(), id: snap.docs[0].id };
}

export async function getSharedItinerary(itineraryId) {
  const itSnap = await getDoc(doc(db, "shared_itineraries", itineraryId));
  if (!itSnap.exists()) throw new Error("Shared link has expired.");
  return itSnap.data();
}

export async function saveSharedItinerary(payload) {
  const docRef = await addDoc(collection(db, "shared_itineraries"), {
    ...payload,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

// ─── Admin CRUD ────────────────────────────────────────────────────────────────

export async function getAllHotels() {
  const snap = await getDocs(collection(db, "hotels"));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function createHotel(data) {
  const docRef = await addDoc(collection(db, "hotels"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateHotel(id, data) {
  await setDoc(doc(db, "hotels", id), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteHotel(id) {
  await deleteDoc(doc(db, "hotels", id));
}

// ─── Hotel Onboarding Requests ─────────────────────────────────────────────────

export async function submitOnboardingRequest(data) {
  const docRef = await addDoc(collection(db, "onboarding_requests"), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getOnboardingRequests() {
  const snap = await getDocs(collection(db, "onboarding_requests"));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function updateOnboardingRequestStatus(id, status) {
  await setDoc(doc(db, "onboarding_requests", id), { status }, { merge: true });
}
