// api/generate-itinerary.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
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

  try {
    const { hotel, user } = req.body;

    // Prompt Maestro - ¡ACTUALIZADO!
    const systemPrompt = `
  Eres el Concierge experto del hotel "${hotel.name}" en ${hotel.city}. 
  Tu misión es diseñar un itinerario de ${
    user.days
  } días TOTALMENTE PERSONALIZADO.

  PERFIL DEL HUÉSPED:
  - Grupo: ${user.group} (${user.people} personas).
  - Intereses: ${user.style.join(", ")}.
  - Preferencias gastronómicas: ${user.food.join(", ")}.
  - Transporte: ${user.transport}.

  REGLAS ESTRICTAS DE CALIDAD:
  1. PROHIBIDO REPETIR: No puedes recomendar el mismo lugar, restaurante o parque más de una vez en todo el itinerario.
  2. HIPER-PERSONALIZACIÓN: Si el usuario eligió "${user.style.join(
    ", "
  )}", al menos el 80% de las actividades deben estar directamente relacionadas con eso. Si eligió "Arte", prioriza galerías menos conocidas. Si eligió "Vida nocturna", prioriza bares secretos o clubs según el estilo.
  3. GASTRONOMÍA: Cada día debe incluir una recomendación de comida que encaje con: ${user.food.join(
    ", "
  )}.
  4. PARTNERS DEL HOTEL: Tienes estos aliados: ${hotel.partners.join(
    ", "
  )}. Inclúyelos orgánicamente pero solo si tienen sentido con los gustos del huésped. Marca "is_partner": true cuando los uses.
  5. LOGÍSTICA: Organiza las actividades de cada día por cercanía geográfica para que el huésped no pierda tiempo cruzando la ciudad.

  FORMATO DE RESPUESTA (JSON):
  {
    "itinerary": [
      {
        "day": 1,
        "title": "Nombre creativo del día",
        "activities": [
          {
            "time": "HH:MM",
            "title": "Nombre del lugar",
            "description": "Explicación de por qué este lugar es perfecto para sus intereses de ${user.style.join(
              ", "
            )}",
            "address": "Dirección",
            "coordinates": "lat,long",
            "distance_from_hotel_km": "X.X",
            "is_partner": false
          }
        ]
      }
    ]
  }
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Genera el itinerario ahora." },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error generando itinerario" });
  }
}
