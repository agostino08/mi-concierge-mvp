// api/generate-itinerary.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hotel, user } = req.body;

    // Prompt Maestro - ¡ACTUALIZADO!
    const systemPrompt = `
      Actúa como el Concierge principal del hotel "${hotel.name}" ubicado en "${hotel.address}" (${hotel.coordinates}) en ${hotel.city}.
      
      OBJETIVO:
      Crear un itinerario de ${user.days} días para un grupo de tipo "${user.group}" (Intereses: ${user.interests}, Comida: ${user.food}, Transporte: ${user.transport}, Ritmo: ${user.pace}).
      
      INSTRUCCIONES CRÍTICAS (MUST):
      1. Tienes estos PARTNERS comerciales del hotel: ${hotel.partners.join(", ")}.
      2. DEBES incluir al menos uno de estos partners CADA DÍA si encaja mínimamente. Cuando lo hagas, marca "is_partner": true.
      3. Rellena el resto de actividades con lugares locales auténticos, bien valorados y relevantes de ${hotel.city}. Evita trampas turísticas genéricas a menos que sea un monumento imprescindible (ej. Sagrada Familia).
      4. Calcula la distancia aproximada en KM desde la ubicación del hotel (${hotel.coordinates}) a cada actividad.
      5. Las actividades en un mismo día deben estar geográficamente optimizadas para no hacer al usuario cruzar la ciudad sin necesidad.
      
      FORMATO DE RESPUESTA:
      Devuelve SOLO un JSON (sin texto antes ni después) con esta estructura exacta:
      {
        "itinerary": [
          {
            "day": 1,
            "title": "Título temático del día (ej: Día de Gaudí y Tapas)",
            "activities": [
              {
                "time": "10:00",
                "title": "Nombre del Lugar/Actividad",
                "description": "Breve descripción atractiva (máx 30 palabras)",
                "address": "Dirección exacta o zona",
                "coordinates": "latitud,longitud" (formato numérico, ej: "41.3879,2.1701"),
                "distance_from_hotel_km": 1.5, // Distancia estimada en KM
                "is_partner": true/false
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
        { role: "user", content: "Genera el itinerario ahora." }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error generando itinerario' });
  }
}