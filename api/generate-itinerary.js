import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { getWeather } from './tools/weather.js';
import { getLocalEvents } from './tools/events.js';
import { searchVenues } from './tools/venues.js';

// --- GOOGLE PLACES VALIDATION (runs after agent, before caching) ---
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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  } catch (e) {
    console.warn('Firebase Admin not initialized. Caching disabled:', e.message);
  }
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_STEPS = 5;

const TOOLS = [
  {
    name: 'get_weather',
    description: 'Get current weather and 3-day forecast for the hotel city. Always call this first.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_local_events',
    description: 'Get upcoming local events (concerts, festivals, shows) in the city for the guest stay dates.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        date_from: { type: 'string', description: 'ISO date YYYY-MM-DD — start of guest stay' },
        date_to: { type: 'string', description: 'ISO date YYYY-MM-DD — end of guest stay' },
      },
      required: ['city', 'date_from', 'date_to'],
    },
  },
  {
    name: 'search_venues',
    description: 'Search Google Places for venues matching guest interests. Call once per interest category.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        query: { type: 'string', description: 'Search query e.g. "rooftop bars" or "vegan restaurants"' },
        max_results: { type: 'integer', description: 'Max results to return, default 5' },
      },
      required: ['city', 'query'],
    },
  },
];

async function executeTool(name, input) {
  switch (name) {
    case 'get_weather':      return getWeather(input);
    case 'get_local_events': return getLocalEvents(input);
    case 'search_venues':    return searchVenues(input);
    default:                 return `Unknown tool: ${name}`;
  }
}

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

    // Cache check — model name included in hash so old OpenAI entries don't match
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
        model: 'claude-haiku-4-5-20251001',
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

    const hotelPartners = hotel.partners?.length > 0
      ? hotel.partners.map(p =>
          `- ${p.name} (${p.category}): ${p.description}${p.discount ? ' — Guest discount: ' + p.discount : ''}`
        ).join('\n')
      : null;

    const systemPrompt = `You are the expert concierge of "${hotel.name}", a ${hotel.hotel_category || 'hotel'} in ${hotel.city}. Deliver a hyper-personalised guide for this specific guest.

TODAY: ${today}

LANGUAGE: Write ALL JSON string values in the language for ISO code "${lang}". Every title, description, and category_tag must be fluent and natural — not a literal translation.

━━━ HOTEL CONTEXT ━━━
${hotelContext || `${hotel.name}, ${hotel.city}`}

━━━ GUEST PROFILE ━━━
- Traveling as: ${user.group}
- Stay: ${user.days} day${user.days > 1 ? 's' : ''} from ${today} to ${endDate}
- Interests: ${guestStyles}
- Food preferences: ${guestFood}
- Budget: ${user.budget}
- Getting around: ${guestTransport}

━━━ TOOL INSTRUCTIONS ━━━
1. Call get_weather("${hotel.city}") first. Use the forecast to flag bad-weather alternatives.
2. Call get_local_events("${hotel.city}", "${today}", "${endDate}"). Highlight relevant events as activities.
3. Call search_venues once per guest interest category. Form queries from interests + budget.
   ONLY recommend venues returned by this tool — never invent venue names.

Query guidance by interest:
- Nightlife → "cocktail bars", "rooftop bars evening", "nightclubs"
- Beach → "beach clubs", "surf schools"
- Nature → "nature reserves", "botanical gardens"
- Wellness & Spa → "spas", "yoga studios"
- Museums & Culture → "art museums", "cultural centres"
- Gastronomy → "food markets", "wine bars", "cooking classes"
- Live Music → "live music bars", "jazz clubs"
- Architecture → "architectural tours"
- Shopping → "luxury boutiques", "artisan markets"
(Use your judgement for other interests)

━━━ OUTPUT ━━━
After all tool calls, respond with ONLY valid JSON — no markdown, no code fences:
{
  "activities": [{"title": "Exact venue name from search results", "description": "2–3 sentences personalised to guest", "is_partner": false, "category_tag": "Short tag in ${lang}"}],
  "food":       [{"title": "Exact venue name from search results", "description": "2–3 sentences with cuisine, vibe, neighbourhood", "is_partner": false}],
  "transport":  [{"title": "Transport mode", "description": "Step-by-step guide with costs and apps"}]
}

Aim for ${Math.min(Math.max(3, Math.round(user.days * 2)), 10)} activities, ${Math.min(Math.max(2, Math.round(user.days * 1.5)), 7)} food items, 2–3 transport items.
${hotelPartners ? `\n━━━ HOTEL PARTNERS — PRIORITISE THESE ━━━\nThese partners are verified. Include where they genuinely match the guest profile and set "is_partner": true:\n${hotelPartners}` : ''}`;

    const messages = [{ role: 'user', content: 'Generate personalized recommendations for this guest.' }];
    let steps = 0;
    let finalText = '';

    while (steps < MAX_STEPS) {
      steps++;
      // Send a ping every 2s during the Anthropic call. This does two things:
      // (1) keeps Vercel's streaming function detector active so it doesn't kill
      //     the function at the 10s default, and (2) resets the client's inactivity timer.
      sseWrite(res, 'ping', {});
      const pingInterval = setInterval(() => sseWrite(res, 'ping', {}), 2000);
      let response;
      try {
        response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          system: systemPrompt,
          tools: TOOLS,
          messages,
        });
      } finally {
        clearInterval(pingInterval);
      }

      if (response.stop_reason === 'end_turn') {
        finalText = response.content.find(b => b.type === 'text')?.text ?? '';
        try {
          const parsed = JSON.parse(finalText);
          sseWrite(res, 'content', parsed);
        } catch {
          sseWrite(res, 'error', { message: 'Could not parse AI response. Please try again.' });
          res.end();
          return;
        }
        sseWrite(res, 'done', {});
        res.end();
        break;
      }

      if (response.stop_reason === 'tool_use') {
        const toolBlocks = response.content.filter(b => b.type === 'tool_use');

        for (const block of toolBlocks) {
          sseWrite(res, 'tool_call', { name: block.name, input: block.input });
        }

        const toolResults = await Promise.all(
          toolBlocks.map(async (block) => {
            try {
              const result = await executeTool(block.name, block.input);
              const summary = String(result).slice(0, 150);
              sseWrite(res, 'tool_result', { name: block.name, summary });
              return { type: 'tool_result', tool_use_id: block.id, content: String(result) };
            } catch (e) {
              const errMsg = `Error: ${e.message}`;
              sseWrite(res, 'tool_result', { name: block.name, summary: errMsg });
              return { type: 'tool_result', tool_use_id: block.id, content: errMsg };
            }
          })
        );

        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });
      }
    }

    if (steps >= MAX_STEPS && !finalText) {
      sseWrite(res, 'error', { message: 'Agent reached maximum steps without completing.' });
      res.end();
    }

    // Fire-and-forget: validate with Google Places and write to cache.
    // Runs after the response is closed so it doesn't delay the client.
    if (db && cacheHash && finalText) {
      Promise.resolve().then(async () => {
        const parsed = JSON.parse(finalText);
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

  } catch (error) {
    console.error('Agent error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error generating options', details: error.message });
    } else if (!res.writableEnded) {
      sseWrite(res, 'error', { message: error.message });
      res.end();
    }
  }
}
