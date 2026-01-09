// api/generate-itinerary.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Configurar CORS para permitir peticiones desde tu frontend
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

    // Prompt Maestro
    const systemPrompt = `
      Actúa como el Concierge principal del hotel "${hotel.name}" en ${
      hotel.city
    }.
      
      OBJETIVO:
      Crear un itinerario de ${user.days} días para un grupo de tipo "${
      user.group
    }" (Intereses: ${user.interests}).
      
      INSTRUCCIONES CRÍTICAS (MUST):
      1. Tienes estos PARTNERS comerciales del hotel: ${hotel.partners.join(
        ", "
      )}.
      2. DEBES incluir al menos uno de estos partners cada día si encaja mínimamente. Cuando lo hagas, marca "is_partner": true.
      3. El resto complétalo con lugares locales auténticos.
      
      FORMATO DE RESPUESTA:
      Devuelve SOLO un JSON (sin texto antes ni después) con esta estructura exacta:
      {
        "itinerary": [
          {
            "day": 1,
            "title": "Título del día",
            "activities": [
              {
                "time": "10:00",
                "title": "Nombre Lugar",
                "description": "Breve descripción atractiva",
                "is_partner": true/false
              }
            ]
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo rápido y barato
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
