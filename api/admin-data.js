import admin from "firebase-admin";
import crypto from "crypto";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  } catch (e) {
    console.warn("[admin-data] Firebase Admin init failed:", e.message);
  }
}

function makeSessionToken(pass) {
  return crypto.createHmac("sha256", pass).update("mi-concierge-admin-session").digest("hex");
}

// Converts Firestore Timestamp objects to plain milliseconds for JSON serialization.
function toPlain(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v.toMillis === "function") out[k] = v.toMillis();
    else if (v && typeof v.toDate === "function") out[k] = v.toDate().getTime();
    else out[k] = v;
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-token");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const adminPass = process.env.ADMIN_PASS;
  if (!adminPass) return res.status(500).json({ error: "ADMIN_PASS not configured." });

  const token = req.headers["x-admin-token"] || "";
  if (token !== makeSessionToken(adminPass)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (!admin.apps.length) {
    return res.status(500).json({ error: "Firebase Admin not available." });
  }

  const db = admin.firestore();
  const { action, ...params } = req.body || {};

  try {
    switch (action) {

      // ─── Hotels ─────────────────────────────────────────────────────────────
      case "getAllHotels": {
        const snap = await db.collection("hotels").get();
        return res.status(200).json(snap.docs.map(d => ({ ...toPlain(d.data()), id: d.id })));
      }

      case "createHotel": {
        const docRef = await db.collection("hotels").add({
          ...params.data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.status(200).json({ id: docRef.id });
      }

      case "updateHotel": {
        await db.collection("hotels").doc(params.id).set(
          { ...params.data, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
        return res.status(200).json({ ok: true });
      }

      case "deleteHotel": {
        await db.collection("hotels").doc(params.id).delete();
        return res.status(200).json({ ok: true });
      }

      // ─── Onboarding requests ─────────────────────────────────────────────────
      case "getOnboardingRequests": {
        const snap = await db.collection("onboarding_requests").get();
        return res.status(200).json(snap.docs.map(d => ({ ...toPlain(d.data()), id: d.id })));
      }

      case "updateOnboardingRequestStatus": {
        await db.collection("onboarding_requests").doc(params.id).set(
          { status: params.status },
          { merge: true }
        );
        return res.status(200).json({ ok: true });
      }

      // ─── Analytics ───────────────────────────────────────────────────────────
      case "getHotelAnalytics": {
        const snap = await db.collection("analytics_events")
          .where("hotelId", "==", params.hotelId)
          .get();
        const cutoffMs = Date.now() - (params.days || 30) * 24 * 60 * 60 * 1000;
        const events = snap.docs
          .map(d => toPlain(d.data()))
          .filter(e => (e.createdAt || 0) > cutoffMs);
        return res.status(200).json(events);
      }

      case "deleteHotelAnalytics": {
        const snap = await db.collection("analytics_events")
          .where("hotelId", "==", params.hotelId)
          .get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        return res.status(200).json({ ok: true });
      }

      case "getAllAnalytics": {
        const snap = await db.collection("analytics_events").get();
        const cutoffMs = Date.now() - (params.days || 30) * 24 * 60 * 60 * 1000;
        const events = snap.docs
          .map(d => toPlain(d.data()))
          .filter(e => (e.createdAt || 0) > cutoffMs);
        return res.status(200).json(events);
      }

      default:
        return res.status(400).json({ error: "Unknown action." });
    }
  } catch (e) {
    console.error("[admin-data]", action, e.message);
    return res.status(500).json({ error: e.message });
  }
}
