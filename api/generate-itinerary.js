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
  Eres el Concierge de Lujo de "${hotel.name}" en ${hotel.city}. 
  Tu objetivo no es solo informar, sino inspirar al huésped diseñando una selección exclusiva de opciones.

  IDIOMA DE RESPUESTA: ${lang === "es" ? "Español" : "Inglés"}.

  PERFIL DETALLADO DEL HUÉSPED:
  - Viaja en: ${user.group}.
  - Intereses declarados: ${user.style.join(", ")}.
  - Gustos gastronómicos: ${user.food.join(", ")}.
  - Nivel de presupuesto: ${
    user.budget
  } (Ajusta las opciones estrictamente a este nivel adquisitivo).
  - Preferencia de movilidad: ${user.transport}.

  INSTRUCCIONES DE CURACIÓN (MODO LISTA):
  1. CATEGORÍA ACTIVIDADES (8 opciones): 
     - Selecciona lugares que encajen con: ${user.style.join(", ")}. 
     - Mezcla iconos de la ciudad con "tesoros escondidos" que solo un local conocería.
     - Si eligieron "Arte", busca exposiciones actuales; si es "Relajación", busca los mejores spas o parques silenciosos.
  2. CATEGORÍA GASTRONOMÍA (6 opciones):
     - Deben reflejar los gustos: ${user.food.join(", ")}.
     - Crucial: Deben respetar el presupuesto "${user.budget}".
     - Incluye una mezcla de desayuno/brunch, comida y cena.
  3. CATEGORÍA TRANSPORTE (3 opciones):
     - Basado en "${
       user.transport
     }", explica la mejor forma de usarlo en esta ciudad específica.

  REGLAS DE ORO:
  - PROHIBIDO REPETIR: No menciones el mismo lugar en diferentes categorías.
  - SIN COORDENADAS INVENTADAS: El "title" debe ser el nombre comercial exacto (ej: "Museo Nacional del Prado" en lugar de "Museo de Arte").
  - PERSONALIZACIÓN EN LA DESCRIPCIÓN: Cada descripción debe empezar explicando por qué esa opción es perfecta para alguien que busca "${
    user.style[0]
  }" o le gusta la comida "${user.food[0]}".
  - ALIADOS DEL HOTEL: Si estos lugares son partners: [${hotel.partners.join(
    ", "
  )}], dales prioridad si encajan con el perfil y marca "is_partner": true.

  FORMATO DE RESPUESTA (JSON ESTRICTO):
  {
    "activities": [
      {
        "title": "Nombre Exacto",
        "description": "Texto persuasivo y personalizado...",
        "is_partner": false,
        "category_tag": "Arte / Historia / etc"
      }
    ],
    "food": [
      {
        "title": "Nombre del Restaurante",
        "description": "Por qué su menú de ${user.food[0]} es increíble...",
        "price_range": "${user.budget}",
        "is_partner": false
      }
    ],
    "transport": [
      {
        "title": "Método de transporte",
        "description": "Consejo experto para moverse en ${hotel.city}..."
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
