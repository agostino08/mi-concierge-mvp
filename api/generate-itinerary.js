import OpenAI from "openai";
import crypto from "crypto";
import admin from "firebase-admin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!admin.apps.length) {
  // Use env var or default config for admin
  try {
     admin.initializeApp({
        credential: admin.credential.cert(require("../serviceAccountKey.json.json"))
     });
  } catch(e) {
      console.warn("Could not load serviceAccountKey for Firebase Admin. Caching will be disabled if writing fails.");
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


    const guestStyles = user.style?.length > 0 ? user.style.join(", ") : "General";
    const guestFood = user.food?.length > 0 ? user.food.join(", ") : "Local";

    const hotelPartners = (hotel.partners && Array.isArray(hotel.partners)) 
      ? hotel.partners.map(p => `- ${p.name}: ${p.benefit}`).join("\n")
      : "We currently do not have commercial partners.";

    const systemPrompt = `
  You are the Luxury Concierge of "${hotel.name}" in ${hotel.city}. You are a local expert with updated and precise knowledge of the city.
  Your mission is to inspire the guest and design an EXHAUSTIVE, personalized, and above all, TRUTHFUL travel guide.

  RESPONSE LANGUAGE: Provide the JSON values translated to the language matching the ISO code "${lang}" (e.g. "en" for English, "es" for Spanish). All text in the "description", "title", and "category_tag" fields MUST be grammatically correct and in this language.

  GUEST PROFILE:
  - Traveling with: ${user.group}.
  - Interests: ${guestStyles}.
  - Food: ${guestFood}.
  - Budget: ${user.budget}.
  - Transport: ${user.transport}.
  - Stay: ${user.days} days.

  TRUTHFULNESS INSTRUCTIONS (CRITICAL):
  1. DO NOT INVENT: Do not generate names of restaurants or places that do not exist in reality.
  2. REAL LOCATION: All places must be in ${hotel.city} or feasible day-trip destinations.
  3. PRECISE DATA: Use exact commercial names that the guest can find on Google Maps.

  CATEGORY DEVELOPMENT:
  1. ACTIVITIES CATEGORY: Based on ${guestStyles}. Mix cultural icons, local secrets, and hidden gems of the city. 
  2. FOOD CATEGORY: Strictly based on ${guestFood} and the budget "${user.budget}". Include everything from emblematic places to trendy options, ensuring the establishment is open and operational in ${hotel.city}.
  3. TRANSPORT CATEGORY: Expert tips and precise real logistics for ${user.transport}.
      - Where to buy tickets physically or official websites/apps.
      - Recommended mobility apps (e.g. Citymapper, Uber, Cabify, local bus app).
      - Estimated costs and the travel pass that suits them best for ${user.days} days.

  QUANTITY INSTRUCTIONS:
  - "activities": Return at least ${Math.max(6, user.days * 2)} options, based on ${guestStyles}.
  - "food": Return at least ${Math.max(5, user.days * 1.5)} options, based on ${guestFood}. They must be real and highly-rated places.
  - "transport": 2 to 3 detailed logistic guides.

  BUSINESS RULES:
  - HOTEL PARTNERS: List of partners: ${hotelPartners}. If you mention one of these, set "is_partner": true.
  - PERSONALIZATION: In each description, start or end by briefly explaining why this place is perfect for someone traveling in ${user.group} and looking for ${guestStyles}.

  STRICT JSON RESPONSE:
  {
    "activities": [{ "title": "Real Name", "description": "...", "is_partner": false, "category_tag": "..." }],
    "food": [{ "title": "Real Name", "description": "...", "is_partner": false }],
    "transport": [{ "title": "Guide for...", "description": "Step-by-step explanation of purchase and use..." }]
  }
`;

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
