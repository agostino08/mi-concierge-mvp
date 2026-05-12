import OpenAI from 'openai';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { getWeather } from './tools/weather.js';
import { getLocalEvents } from './tools/events.js';

// --- GOOGLE PLACES VALIDATION (runs after generation, before caching) ---
async function validatePlace(name, city, apiKey) {
  try {
    const input = encodeURIComponent(`${name} ${city}`);
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${input}&inputtype=textquery&fields=business_status,rating,name&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK' || !data.candidates?.length) return null;
    const place = data.candidates[0];
    if (place.business_status === 'CLOSED_PERMANENTLY' || place.business_status === 'CLOSED_TEMPORARILY') return null;
    return { rating: place.rating || null };
  } catch (e) {
    console.warn(`Places error for "${name}":`, e.message);
    return { rating: null };
  }
}

async function validateItems(items, city, apiKey) {
  const results = await Promise.all(
    items.map(async (item) => {
      if (item.is_partner) return item;
      const v = await validatePlace(item.title, city, apiKey);
      if (v === null) return null;
      return { ...item, ...(v.rating ? { rating: v.rating } : {}) };
    })
  );
  return results.filter(Boolean);
}
// --- END GOOGLE PLACES VALIDATION ---

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  } catch (e) {
    console.warn('Firebase Admin not initialized. Caching disabled:', e.message);
  }
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting
  const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const ipKey = rawIp.replace(/[^a-zA-Z0-9]/g, '_');
  try {
    if (admin.apps.length) {
      const db = admin.firestore();
      const rlRef = db.collection('rate_limits').doc(ipKey);
      const now = Date.now();
      const snap = await rlRef.get();
      const data = snap.data();
      if (!data || now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
        await rlRef.set({ count: 1, windowStart: now });
      } else if (data.count >= MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests. Please try again in 10 minutes.' });
      } else {
        await rlRef.update({ count: data.count + 1 });
      }
    }
  } catch (e) {
    console.warn('Rate limit check failed (non-blocking):', e.message);
  }

  try {
    const { hotel, user, lang } = req.body;
    if (!hotel?.name) return res.status(400).json({ error: 'Incomplete hotel data' });

    // Cache check — model included in hash so old entries don't match after model changes
    let db, cacheHash;
    try {
      db = admin.firestore();
      const hashPayload = JSON.stringify({
        hotelId: hotel.id,
        group: user.group,
        days: user.days,
        style: (user.style || []).sort().join(','),
        food: (user.food || []).sort().join(','),
        budget: user.budget,
        transport: (user.transport || []).sort().join(','),
        lang,
        model: 'gpt-4o-mini-v2',
      });
      cacheHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
      const cachedDoc = await db.collection('cached_itineraries').doc(cacheHash).get();
      if (cachedDoc.exists) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        sseWrite(res, 'content', cachedDoc.data().result);
        sseWrite(res, 'done', {});
        return res.end();
      }
    } catch (e) {
      console.warn('Cache check error:', e.message);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const today = new Date().toISOString().split('T')[0];
    const endDt = new Date();
    endDt.setDate(endDt.getDate() + (user.days - 1));
    const endDate = endDt.toISOString().split('T')[0];

    // --- PRE-FETCH: weather + events in parallel, with SSE progress events ---
    sseWrite(res, 'tool_call', { name: 'get_weather', input: { city: hotel.city } });
    sseWrite(res, 'tool_call', { name: 'get_local_events', input: { city: hotel.city, date_from: today, date_to: endDate } });

    const [weatherResult, eventsResult] = await Promise.all([
      getWeather({ city: hotel.city }).catch(e => `Weather data unavailable: ${e.message}`),
      getLocalEvents({ city: hotel.city, date_from: today, date_to: endDate }).catch(e => `Events data unavailable: ${e.message}`),
    ]);

    sseWrite(res, 'tool_result', { name: 'get_weather', summary: String(weatherResult).slice(0, 150) });
    sseWrite(res, 'tool_result', { name: 'get_local_events', summary: String(eventsResult).slice(0, 150) });
    // --- END PRE-FETCH ---

    const guestStyles    = user.style?.length    > 0 ? user.style.join(', ')    : 'General sightseeing';
    const guestFood      = user.food?.length      > 0 ? user.food.join(', ')     : 'Local cuisine';
    const guestTransport = user.transport?.length > 0 ? user.transport.join(', '): 'Walking';

    const hotelContext = [
      hotel.hotel_category && `Category: ${hotel.hotel_category}`,
      hotel.hotel_stars    && `Rating: ${hotel.hotel_stars}`,
      hotel.neighborhood   && `Neighbourhood: ${hotel.neighborhood}`,
      hotel.description    && `About the hotel: ${hotel.description}`,
      hotel.ai_context     && `Local context: ${hotel.ai_context}`,
    ].filter(Boolean).join('\n');

    const hotelPartners = (hotel.partners?.length > 0)
      ? hotel.partners.map(p =>
          `- ${p.name} (${p.category}): ${p.description}${p.discount ? ' — Guest discount: ' + p.discount : ''}`
        ).join('\n')
      : null;

    const systemPrompt = `You are the expert concierge of "${hotel.name}", a ${hotel.hotel_category || 'hotel'} in ${hotel.city}. Your mission is to deliver a hyper-personalised guide that feels tailor-made for this specific guest — not a generic tourist list.

LANGUAGE: Write ALL JSON string values in the language for ISO code "${lang}". Every title, description, and category_tag must be fluent and natural — not a literal translation.

━━━ LIVE CONTEXT ━━━
Weather during guest stay: ${weatherResult}
Local events during stay (${today} → ${endDate}): ${eventsResult}

Use this live data to:
- Flag bad-weather days in activity descriptions and suggest indoor alternatives
- Include relevant events as activity recommendations (preserve the tickets URL if provided)
- Adjust outdoor recommendations based on the forecast

━━━ HOTEL CONTEXT ━━━
${hotelContext || `${hotel.name}, ${hotel.city}`}

━━━ GUEST PROFILE ━━━
- Traveling as:      ${user.group}
- Days staying:      ${user.days} day${user.days > 1 ? 's' : ''}
- Travel interests:  ${guestStyles}
- Food preferences:  ${guestFood}
- Budget:            ${user.budget}
- Getting around by: ${guestTransport}

━━━ CORE RULE: GUEST INTERESTS ARE THE ONLY FILTER ━━━
The guest's selected interests ("${guestStyles}") are the SOLE lens for every activity you recommend.
- DO NOT add sightseeing, landmarks, or museums unless the guest chose "Guided Tours", "Architecture", "History", or "Museums & Culture".
- DO NOT add beaches or nature unless the guest chose "Beach", "Nature", or "Mountains".
- A guest who chose Nightlife wants bars, clubs, and late-night venues — NOT museums or monuments.

━━━ VERIFIED REAL PLACES — YOUR MOST CRITICAL RESPONSIBILITY ━━━
The guest will physically visit every place you name. If it does not exist or is closed, they will be stranded.

1. ONLY recommend venues you are HIGHLY CERTAIN exist and are CURRENTLY OPERATING in ${hotel.city}.
2. Use the EXACT commercial name as it appears on Google Maps.
3. NEVER invent, approximate, or conflate venue names.
4. Prefer well-established venues (5+ years operating) over recent or obscure openings.
5. If you cannot confidently name a real venue for a slot, SKIP THAT SLOT entirely.
6. It is far better to return 3 real places than 6 where 2 are invented.
7. NEVER include addresses, phone numbers, or opening hours — you cannot verify these.

━━━ ACTIVITIES — EXCLUSIVELY BASED ON: ${guestStyles} ━━━
• Nightlife        → cocktail bars, nightclubs, wine bars, rooftop bars, jazz clubs, live DJ venues
• Nature           → botanical gardens, nature reserves, greenways, scenic viewpoints
• Beach            → named beaches, beach clubs, surf schools, coastal promenades
• Rooftops         → rooftop bars, sky lounges, rooftop restaurants, open-air observation decks
• Live Music       → live music bars, jazz clubs, flamenco tablaos, concert halls
• Museums & Culture → museums, art galleries, cultural centres, permanent exhibitions
• Wellness & Spa   → spas, thermal baths, yoga studios, wellness retreats
• Gastronomy       → food markets, culinary tours, cooking classes, wine/cheese tastings
(Apply your judgment for other interests)

Scale quantity and pace to ${user.days} day${user.days > 1 ? 's' : ''}.
Each description must say WHY this venue matches "${guestStyles}" for a ${user.group} on a ${user.budget} budget.

━━━ FOOD & DRINK — STRICTLY BASED ON: ${guestFood} ━━━
- Match every recommendation to the food style (${guestFood}) AND budget (${user.budget}).
- Cover meal occasions suited to ${user.days} day${user.days > 1 ? 's' : ''}.
- For each venue, mention the neighbourhood.

━━━ TRANSPORT — BASED ON: ${guestTransport} ━━━
- Concrete, actionable logistics: exact app names, ticket types, estimated costs in local currency.
- One practical guide per transport mode selected.

━━━ QUANTITIES ━━━
- "activities": aim for ${Math.min(Math.max(3, Math.round(user.days * 2)), 10)} items
- "food": aim for ${Math.min(Math.max(2, Math.round(user.days * 1.5)), 7)} items
- "transport": 2–3 items

${hotelPartners ? `━━━ HOTEL PARTNERS — PRIORITISE THESE ━━━
These are verified partners of ${hotel.name}. Include them where they genuinely match the guest profile and set "is_partner": true:
${hotelPartners}

` : ''}━━━ OUTPUT FORMAT ━━━
Respond with ONLY valid JSON — no markdown, no code fences, no text before or after:
{
  "activities": [{ "title": "Exact venue name", "description": "2–3 sentences personalised to guest", "is_partner": false, "category_tag": "Short interest tag in ${lang}", "tickets_url": null }],
  "food":       [{ "title": "Exact venue name", "description": "2–3 sentences with cuisine style, vibe, and neighbourhood", "is_partner": false }],
  "transport":  [{ "title": "Transport mode title", "description": "Step-by-step practical guide with costs, apps, and tips" }]
}
For event-based activities that include a tickets URL from the live events data, set "tickets_url" to the URL string instead of null.`;

    // Signal that we're now calling the AI
    sseWrite(res, 'tool_call', { name: 'generating', input: {} });
    const pingInterval = setInterval(() => sseWrite(res, 'ping', {}), 2000);

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the personalized recommendations now.' },
        ],
        response_format: { type: 'json_object' },
      });
    } finally {
      clearInterval(pingInterval);
    }

    const rawText = completion.choices[0]?.message?.content || '';

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('JSON parse failed. Raw response:', rawText?.slice(0, 500));
      sseWrite(res, 'error', { message: 'Could not parse AI response. Please try again.' });
      res.end();
      return;
    }

    sseWrite(res, 'content', parsed);
    sseWrite(res, 'done', {});
    res.end();

    // Fire-and-forget: validate with Google Places and write to cache
    if (db && cacheHash) {
      Promise.resolve().then(async () => {
        const placesKey = process.env.GOOGLE_PLACES_API_KEY;
        if (placesKey) {
          const [validatedActivities, validatedFood] = await Promise.all([
            validateItems(parsed.activities || [], hotel.city, placesKey),
            validateItems(parsed.food || [], hotel.city, placesKey),
          ]);
          parsed.activities = validatedActivities;
          parsed.food = validatedFood;
        }
        await db.collection('cached_itineraries').doc(cacheHash).set({
          result: parsed,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }).catch(e => console.error('Validate/cache error:', e.message));
    }

    return;
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error generating options', details: error.message });
    } else if (!res.writableEnded) {
      sseWrite(res, 'error', { message: error.message });
      res.end();
    }
  }
}
