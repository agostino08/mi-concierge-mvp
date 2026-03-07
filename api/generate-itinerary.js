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

    const systemPrompt = `You are the expert concierge of "${hotel.name}", a ${hotel.hotel_category || 'hotel'} in ${hotel.neighborhood ? hotel.neighborhood + ', ' : ''}${hotel.city}. You have deep, first-hand knowledge of ${hotel.city} and a passion for giving guests authentic, personalised experiences.

LANGUAGE: Write ALL JSON string values in the language for ISO code "${lang}". Every title, description, and category_tag must be fluent, natural — not a literal translation.

━━━ HOTEL CONTEXT ━━━
${hotelContext || `${hotel.name}, ${hotel.city}`}

━━━ GUEST PROFILE ━━━
- Traveling as:      ${user.group}
- Days staying:      ${user.days} day${user.days > 1 ? 's' : ''}
- Travel interests:  ${guestStyles}
- Food preferences:  ${guestFood}
- Budget:            ${user.budget}
- Getting around by: ${guestTransport}

━━━ ANTI-HALLUCINATION RULES — STRICTLY ENFORCED ━━━
1. ONLY recommend places you are highly confident EXIST and are CURRENTLY OPERATING in ${hotel.city}.
2. Use the EXACT commercial name as found on Google Maps — guests will search for it directly.
3. If you are not certain a specific venue is still open, describe the neighbourhood/experience type instead of naming a venue.
4. NEVER invent addresses, phone numbers, websites, or opening hours.
5. Prefer well-established venues (3+ years) over trendy new ones you are not sure about.
6. If a category has few high-quality real options matching the profile, return fewer results — never pad with invented places.

━━━ ACTIVITIES (based on: ${guestStyles}) ━━━
- Mix iconic landmarks with genuine local gems appropriate for ${user.group} on a ${user.budget} budget.
- Scale quantity and pace to ${user.days} day${user.days > 1 ? 's' : ''} — do not overwhelm a 1-day visitor.
- Each description must explain WHY this specific place suits someone interested in ${guestStyles}.

━━━ FOOD & DRINK (based on: ${guestFood}) ━━━
- Match strictly to food style (${guestFood}) AND budget (${user.budget}).
- Cover appropriate meal occasions for ${user.days} day${user.days > 1 ? 's' : ''} (breakfast, lunch, dinner, snacks as relevant).
- Mention the neighbourhood so the guest can plan routing.

━━━ TRANSPORT (based on: ${guestTransport}) ━━━
- Give concrete, actionable logistics: exact app names, ticket types, where to buy, estimated costs.
- Provide a guide for each relevant transport mode the guest selected.
- Recommend the most cost-effective pass or combination for ${user.days} day${user.days > 1 ? 's' : ''}.

━━━ QUANTITIES ━━━
- "activities": ${Math.min(Math.max(4, Math.round(user.days * 2.5)), 12)} items
- "food": ${Math.min(Math.max(3, Math.round(user.days * 1.5)), 8)} items
- "transport": 2–3 items (one per selected transport mode)

${hotelPartners ? `━━━ HOTEL PARTNERS — PRIORITISE THESE ━━━
These are verified partners of ${hotel.name}. Include them where they genuinely match the guest profile and set "is_partner": true:
${hotelPartners}

` : ''
}━━━ OUTPUT FORMAT ━━━
Respond with ONLY valid JSON — no markdown, no code fences, no text before or after the JSON object.
{
  "activities": [{ "title": "Exact venue name", "description": "2–3 sentences personalised to this guest", "is_partner": false, "category_tag": "Short tag in ${lang}" }],
  "food":       [{ "title": "Exact venue name", "description": "2–3 sentences personalised to this guest", "is_partner": false }],
  "transport":  [{ "title": "Transport guide title", "description": "Step-by-step practical guide with costs, apps, and tips" }]
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
