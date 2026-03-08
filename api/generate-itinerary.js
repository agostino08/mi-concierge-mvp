import OpenAI from "openai";
import crypto from "crypto";
import admin from "firebase-admin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  } catch (e) {
    console.warn("Firebase Admin not initialized. Caching disabled:", e.message);
  }
}

// Simple In-Memory Rate Limiter (approximate for Serverless)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;

// Helper to clean old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimit.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimit.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);


export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- RATE LIMITING ---
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown_ip";
  const now = Date.now();
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, timestamp: now });
  } else {
    const data = rateLimit.get(ip);
    if (now - data.timestamp > RATE_LIMIT_WINDOW_MS) {
       rateLimit.set(ip, { count: 1, timestamp: now }); // Reset window
    } else {
       if (data.count >= MAX_REQUESTS) {
         return res.status(429).json({ error: "Too many requests. Please try again later." });
       }
       data.count++;
       rateLimit.set(ip, data);
    }
  }
  // --- END RATE LIMITING ---

  try {
    const { hotel, user, lang } = req.body;

    if (!hotel || !hotel.name) {
      return res.status(400).json({ error: "Incomplete hotel data" });
    }

    // --- CACHING LOGIC ---
    let db;
    let cacheHash;
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
         lang: lang
      });
      cacheHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
      
      const cachedDoc = await db.collection("cached_itineraries").doc(cacheHash).get();
      if (cachedDoc.exists) {
         res.setHeader("Content-Type", "text/event-stream");
         res.setHeader("Cache-Control", "no-cache");
         res.setHeader("Connection", "keep-alive");
         const cachedData = JSON.stringify(cachedDoc.data().result);
         res.write(cachedData);
         return res.end();
      }
    } catch(e) {
      console.warn("Firebase Admin caching error or not configured:", e.message);
    }
    // --- END CACHING FIREBASE READ ---


    const guestStyles    = user.style?.length    > 0 ? user.style.join(", ")    : "General sightseeing";
    const guestFood      = user.food?.length      > 0 ? user.food.join(", ")     : "Local cuisine";
    const guestTransport = user.transport?.length > 0 ? user.transport.join(", "): "Walking";

    const hotelPartners = (hotel.partners && Array.isArray(hotel.partners) && hotel.partners.length > 0)
      ? hotel.partners.map(p => `- ${p.name} (${p.category}): ${p.description}${p.discount ? ' — Guest discount: ' + p.discount : ''}`).join("\n")
      : null;

    const hotelContext = [
      hotel.hotel_category && `Category: ${hotel.hotel_category}`,
      hotel.hotel_stars    && `Rating: ${hotel.hotel_stars}`,
      hotel.neighborhood   && `Neighbourhood: ${hotel.neighborhood}`,
      hotel.description    && `About the hotel: ${hotel.description}`,
      hotel.ai_context     && `Local context: ${hotel.ai_context}`,
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are the expert concierge of "${hotel.name}", a ${hotel.hotel_category || 'hotel'} in ${hotel.neighborhood ? hotel.neighborhood + ', ' : ''}${hotel.city}. Your mission is to deliver a hyper-personalised guide that feels tailor-made for this specific guest — not a generic tourist list.

LANGUAGE: Write ALL JSON string values in the language for ISO code "${lang}". Every title, description, and category_tag must be fluent and natural — not a literal translation.

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
- DO NOT pad the list with generic tourist spots that do not match the chosen interests.
- A guest who chose Nightlife wants bars, clubs, and late-night venues — NOT museums or monuments.
- Mix interests only when multiple were selected.

━━━ VERIFIED REAL PLACES — STRICTLY ENFORCED ━━━
1. ONLY recommend venues you are highly confident EXIST and are CURRENTLY OPERATING in ${hotel.city}.
2. Use the EXACT commercial name as it appears on Google Maps — guests will search for it directly.
3. NEVER invent, guess, or approximate addresses, phone numbers, websites, or opening hours.
4. Prefer well-established venues (3+ years operating) over recent openings you are uncertain about.
5. If you cannot confidently name a real, currently-open venue for a category, describe the experience type or neighbourhood instead of fabricating a name.
6. Return FEWER results rather than pad with unverified or fictional places.

━━━ ACTIVITIES — EXCLUSIVELY BASED ON: ${guestStyles} ━━━
Every activity must directly serve at least one of the guest's selected interests. Use this mapping:

• Nightlife        → cocktail bars, nightclubs, wine bars, rooftop bars (evening/night), jazz clubs, live DJ venues, late-night tapas spots
• Nature           → botanical gardens, nature reserves, greenways, scenic viewpoints, coastal nature paths
• Mountains        → cable cars, mountain hikes, mountain villages, ski resorts (if seasonal), mountain panoramic viewpoints
• Beach            → named beaches, beach clubs, surf schools, coastal promenades
• Rooftops         → rooftop bars, sky lounges, rooftop restaurants, open-air observation decks with city views
• Parks            → city parks, urban gardens, landscaped public spaces, riverside walks
• Live Music       → live music bars, jazz clubs, flamenco tablaos, concert halls, open-air music venues
• Theater & Shows  → theaters, opera houses, comedy clubs, cultural performance venues, cabaret shows
• Guided Tours     → walking tours, private city tours, food tours, bike tours, boat tours
• Museums & Culture → museums, art galleries, cultural centres, permanent exhibitions, cultural foundations
• Local Experiences → local markets, neighbourhood craft workshops, authentic studios, community-led experiences
• Luxury Shopping  → designer boutiques, luxury concept stores, high-end jewellers, flagship department stores
• Handicrafts      → artisan markets, pottery/textile studios, craft workshops, local artisan shops
• Architecture     → iconic buildings, architectural walking routes, historic districts, skyline viewpoints
• Wellness & Spa   → spas, thermal baths, yoga studios, sound healing sessions, wellness retreats, float tanks
• Sports           → sports events/stadiums, golf courses, climbing walls, cycling routes, water sports centres
• History          → historical sites, ancient monuments, old town districts, heritage museums
• Relax            → scenic café terraces, tranquil gardens, lakeside or seaside promenades, panoramic resting spots
• Gastronomy       → food markets, culinary tours, cooking classes, gourmet food shops, wine/cheese tastings

Scale quantity and pace to ${user.days} day${user.days > 1 ? 's' : ''} — do not overwhelm a 1-day visitor.
Each description must explicitly state WHY this venue matches "${guestStyles}" for a ${user.group} on a ${user.budget} budget.

━━━ FOOD & DRINK — STRICTLY BASED ON: ${guestFood} ━━━
- Match every recommendation directly to the food style (${guestFood}) AND budget (${user.budget}).
- DO NOT default to generic "local cuisine" if the guest chose a specific style (Michelin Star, Vegan, Asian, etc.).
- Cover meal occasions suited to ${user.days} day${user.days > 1 ? 's' : ''} (breakfast, lunch, dinner, drinks as relevant).
- For each venue, mention the neighbourhood so the guest can plan routing.

━━━ TRANSPORT — BASED ON: ${guestTransport} ━━━
- Give concrete, actionable logistics: exact app names, ticket types, where to buy, estimated costs in local currency.
- One practical guide per transport mode the guest selected.
- Recommend the most cost-effective pass or combination for ${user.days} day${user.days > 1 ? 's' : ''}.

━━━ QUANTITIES ━━━
- "activities": ${Math.min(Math.max(4, Math.round(user.days * 2.5)), 12)} items
- "food": ${Math.min(Math.max(3, Math.round(user.days * 1.5)), 8)} items
- "transport": 2–3 items (one per selected mode)

${hotelPartners ? `━━━ HOTEL PARTNERS — PRIORITISE THESE ━━━
These are verified partners of ${hotel.name}. Include them where they genuinely match the guest profile and set "is_partner": true:
${hotelPartners}

` : ''
}━━━ OUTPUT FORMAT ━━━
Respond with ONLY valid JSON — no markdown, no code fences, no text before or after the JSON object.
{
  "activities": [{ "title": "Exact venue name", "description": "2–3 sentences personalised to this guest's specific interests", "is_partner": false, "category_tag": "Short interest tag in ${lang}" }],
  "food":       [{ "title": "Exact venue name", "description": "2–3 sentences with cuisine style, vibe, and neighbourhood", "is_partner": false }],
  "transport":  [{ "title": "Transport mode title", "description": "Step-by-step practical guide with costs, apps, and tips" }]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: "Generate the personalized recommendations now.",
        },
      ],
      response_format: { type: "json_object" },
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(content);
      }
    }

    // --- CACHING SAVE LOGIC ---
    if (db && cacheHash) {
       try {
           const parsedResult = JSON.parse(fullResponse);
           await db.collection("cached_itineraries").doc(cacheHash).set({
               result: parsedResult,
               createdAt: admin.firestore.FieldValue.serverTimestamp()
           });
       } catch (e) {
           console.error("Failed to save cache:", e.message);
       }
    }
    // --- END CACHING SAVE LOGIC ---

    return res.end();
  } catch (error) {
    console.error("API Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Error generating options", details: error.message });
    }
    return res.end();
  }
}
