import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

// Unique session ID per browser tab — resets on new tab or hard refresh
const sessionId = (() => {
  let id = sessionStorage.getItem('mc_session');
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem('mc_session', id);
  }
  return id;
})();

/**
 * Fire-and-forget analytics event.
 * Never throws, never awaited — guaranteed not to break the guest flow.
 */
export function logEvent(hotelId, eventType, data = {}) {
  if (!hotelId) return;
  addDoc(collection(db, 'analytics_events'), {
    hotelId,
    eventType,
    data,
    sessionId,
    createdAt: serverTimestamp(),
  }).catch((e) => { console.error('[analytics] write failed:', e.code, e.message); });
}

/**
 * Fetch analytics events for a single hotel, filtered to the last `days` days.
 */
export async function getHotelAnalytics(hotelId, days = 30) {
  const snap = await getDocs(
    query(collection(db, 'analytics_events'), where('hotelId', '==', hotelId))
  );
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return snap.docs
    .map(d => d.data())
    .filter(e => e.createdAt?.toMillis() > cutoff);
}

/**
 * Fetch all analytics events across every hotel (global view).
 */
export async function getAllAnalytics(days = 30) {
  const snap = await getDocs(collection(db, 'analytics_events'));
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return snap.docs
    .map(d => d.data())
    .filter(e => e.createdAt?.toMillis() > cutoff);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function topN(counts, n = 5) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

function countBy(events, key) {
  const counts = {};
  events.forEach(e => {
    const val = e.data?.[key];
    if (val) counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

function countArrayField(events, key) {
  const counts = {};
  events.forEach(e => {
    const arr = e.data?.[key];
    if (Array.isArray(arr)) arr.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
  });
  return counts;
}

/**
 * Compute aggregated stats from a raw events array.
 * Pass `hotels` (array of { id, name }) to get named hotel breakdown (global view).
 */
export function computeStats(events, hotels = []) {
  // ── Core metrics ────────────────────────────────────────────────────────────
  const sessions = new Set(
    events.filter(e => e.eventType === 'session_start').map(e => e.sessionId)
  ).size;
  const generated = events.filter(e => e.eventType === 'itinerary_generated').length;
  const chatOpens = events.filter(e => e.eventType === 'chat_opened').length;
  const favorites = events.filter(e => e.eventType === 'place_favorited').length;
  const shares    = events.filter(e => e.eventType === 'itinerary_shared').length;

  // ── Chatbot topics ──────────────────────────────────────────────────────────
  const topicCounts = {};
  events
    .filter(e => e.eventType === 'chat_pill' || e.eventType === 'chat_faq')
    .forEach(e => {
      const label = e.data?.topic || (e.data?.question ? e.data.question.slice(0, 40) : null);
      if (label) topicCounts[label] = (topicCounts[label] || 0) + 1;
    });
  const topTopics = topN(topicCounts);

  // ── Language breakdown ──────────────────────────────────────────────────────
  const langCounts = countBy(events.filter(e => e.eventType === 'language_selected'), 'lang');
  const langTotal = Object.values(langCounts).reduce((a, b) => a + b, 0);
  const langs = topN(langCounts).map(({ label: lang, count }) => ({
    lang,
    count,
    pct: langTotal > 0 ? Math.round((count / langTotal) * 100) : 0,
  }));

  // ── Questionnaire preferences ───────────────────────────────────────────────
  const qEvents = events.filter(e => e.eventType === 'questionnaire_completed' && e.data);
  const qTotal = qEvents.length;

  const groupCounts     = countBy(qEvents, 'group');
  const budgetCounts    = countBy(qEvents, 'budget');
  const styleCounts     = countArrayField(qEvents, 'style');
  const foodCounts      = countArrayField(qEvents, 'food');
  const transportCounts = countArrayField(qEvents, 'transport');

  const daysBuckets = { '1–2 days': 0, '3–5 days': 0, '6–7 days': 0, '8+ days': 0 };
  qEvents.forEach(e => {
    const d = Number(e.data?.days);
    if (d >= 1 && d <= 2)  daysBuckets['1–2 days']++;
    else if (d >= 3 && d <= 5) daysBuckets['3–5 days']++;
    else if (d >= 6 && d <= 7) daysBuckets['6–7 days']++;
    else if (d >= 8)           daysBuckets['8+ days']++;
  });

  const styleTotal     = Object.values(styleCounts).reduce((a, b) => a + b, 0);
  const foodTotal      = Object.values(foodCounts).reduce((a, b) => a + b, 0);
  const transportTotal = Object.values(transportCounts).reduce((a, b) => a + b, 0);

  const questionnaire = {
    total: qTotal,
    group:     topN(groupCounts, 5),
    budget:    topN(budgetCounts, 3),
    style:     topN(styleCounts, 5),
    food:      topN(foodCounts, 5),
    transport: topN(transportCounts, 5),
    styleTotal,
    foodTotal,
    transportTotal,
    days: Object.entries(daysBuckets)
      .map(([label, count]) => ({ label, count }))
      .filter(d => d.count > 0),
  };

  // ── Hotel breakdown (global view only) ─────────────────────────────────────
  const hotelSessionCounts = {};
  events.filter(e => e.eventType === 'session_start').forEach(e => {
    if (e.hotelId) hotelSessionCounts[e.hotelId] = (hotelSessionCounts[e.hotelId] || 0) + 1;
  });
  const hotelBreakdown = Object.entries(hotelSessionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([hotelId, count]) => {
      const hotel = hotels.find(h => h.id === hotelId);
      return { hotelId, name: hotel?.name || hotelId.slice(0, 8) + '…', count };
    });

  return { sessions, generated, chatOpens, favorites, shares, topTopics, langs, questionnaire, hotelBreakdown };
}
