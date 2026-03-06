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
  }).catch(() => {});
}

/**
 * Fetch all analytics events for a hotel, filtered to the last `days` days.
 * Used by the admin panel Insights card.
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
 * Compute aggregated stats from raw event array.
 */
export function computeStats(events) {
  const sessions = new Set(
    events.filter(e => e.eventType === 'session_start').map(e => e.sessionId)
  ).size;

  const generated = events.filter(e => e.eventType === 'itinerary_generated').length;
  const chatOpens = events.filter(e => e.eventType === 'chat_opened').length;
  const favorites = events.filter(e => e.eventType === 'place_favorited').length;
  const shares    = events.filter(e => e.eventType === 'itinerary_shared').length;

  // Top chatbot topics (pills + FAQs combined)
  const topicCounts = {};
  events
    .filter(e => e.eventType === 'chat_pill' || e.eventType === 'chat_faq')
    .forEach(e => {
      const label = e.data?.topic || (e.data?.question ? e.data.question.slice(0, 40) : null);
      if (label) topicCounts[label] = (topicCounts[label] || 0) + 1;
    });
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  // Language breakdown (from language_selected events)
  const langCounts = {};
  events.filter(e => e.eventType === 'language_selected').forEach(e => {
    const lang = e.data?.lang || 'en';
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  });
  const langTotal = Object.values(langCounts).reduce((a, b) => a + b, 0);
  const langs = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, count]) => ({
      lang,
      count,
      pct: langTotal > 0 ? Math.round((count / langTotal) * 100) : 0,
    }));

  return { sessions, generated, chatOpens, favorites, shares, topTopics, langs };
}
