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

// ─── Admin API helper ──────────────────────────────────────────────────────────
// All admin writes route through /api/admin-data (Firebase Admin SDK, bypasses rules).
// Session token is stored in sessionStorage by AdminView.vue after login.

async function adminRequest(action, params = {}) {
  const token = sessionStorage.getItem("mi_admin_token") || "";
  const res = await fetch("/api/admin-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-token": token },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "Admin request failed");
  }
  return res.json();
}

// ─── Admin CRUD ────────────────────────────────────────────────────────────────

export async function getAllHotels() {
  return adminRequest("getAllHotels");
}

export async function createHotel(data) {
  const result = await adminRequest("createHotel", { data });
  return result.id;
}

export async function updateHotel(id, data) {
  await adminRequest("updateHotel", { id, data });
}

export async function deleteHotel(id) {
  await adminRequest("deleteHotel", { id });
}

// ─── Hotel Onboarding Requests ─────────────────────────────────────────────────

export async function submitOnboardingRequest(data) {
  // Guest-facing: client SDK write is allowed by Firestore rules (create-only).
  const docRef = await addDoc(collection(db, "onboarding_requests"), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getOnboardingRequests() {
  return adminRequest("getOnboardingRequests");
}

export async function updateOnboardingRequestStatus(id, status) {
  await adminRequest("updateOnboardingRequestStatus", { id, status });
}
