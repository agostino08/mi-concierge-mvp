import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  try {
    // Extraemos lang del body (que viene de tu App.vue)
    const { hotel, user, lang } = req.body;

    // Validación básica para evitar errores de variables no definidas
    const guestStyles =
      user.style && user.style.length > 0 ? user.style.join(", ") : "General";
    const guestFood =
      user.food && user.food.length > 0 ? user.food.join(", ") : "Local";
    // En api/generate-itinerary.js
    // Transformamos el array de objetos en un texto legible para la IA
    const hotelPartners = hotel.partners && hotel.partners.length > 0 
      ? hotel.partners.map(p => `- ${p.name}: ${p.benefit}`).join("\n")
      : "Actualmente no tenemos socios comerciales.";

    const systemPrompt = `
  Eres el Concierge de Lujo de "${hotel.name}" en ${hotel.city}. Eres un experto local con conocimientos actualizados y precisos de la ciudad.
  Tu misión es inspirar al huésped y diseñar una guía de viaje EXHAUSTIVA, personalizada y, sobre todo, VERÍDICA.

  IDIOMA DE RESPUESTA: ${lang === "en" ? "Inglés" : "Español"}.

  PERFIL DEL HUÉSPED:
  - Viaja en: ${user.group}.
  - Intereses: ${guestStyles}.
  - Comida: ${guestFood}.
  - Presupuesto: ${user.budget}.
  - Transporte: ${user.transport}.
  - Estancia: ${user.days} días.

  INSTRUCCIONES DE VERACIDAD (CRÍTICO):
  1. PROHIBIDO INVENTAR: No generes nombres de restaurantes o lugares que no existan en la realidad.
  2. UBICACIÓN REAL: Todos los lugares deben estar en ${hotel.city} o ser escapadas factibles de ida y vuelta en el día.
  3. DATOS PRECISOS: Usa nombres comerciales exactos que el huésped pueda encontrar en Google Maps.

  DESARROLLO DE CATEGORÍAS:
  1. CATEGORÍA ACTIVIDADES: Basadas en ${guestStyles}. Mezcla iconos culturales, secretos locales y gemas ocultas de la ciudad. 
  2. CATEGORÍA GASTRONOMÍA: Basadas estrictamente en ${guestFood} y el presupuesto "${user.budget}". Incluye desde sitios emblemáticos hasta opciones de moda, asegurando que el establecimiento está abierto y operativo en ${hotel.city}.
  3. CATEGORÍA TRANSPORTE: Consejos expertos y logística real para ${user.transport}.
      - Dónde comprar tickets físicamente o webs/apps oficiales.
      - Apps de movilidad recomendadas (ej. Citymapper, Uber, Cabify, app local de buses).
      - Costos estimados y el abono que más le conviene por ${user.days} días.

  INSTRUCCIONES DE CANTIDAD:
  - "activities": Devuelve al menos ${Math.max(6, user.days * 2)} opciones, basado en ${guestStyles}.
  - "food": Devuelve al menos ${Math.max(5, user.days * 1.5)} opciones, basado en ${guestFood}. Que sean lugares reales y bien puntuados.
  - "transport": 2 a 3 guías logísticas detalladas.

  REGLAS DE NEGOCIO:
  - SOCIOS DEL HOTEL (PARTNERS): Lista de partners: ${hotelPartners}. Si mencionas uno de estos, marca "is_partner": true.
  - PERSONALIZACIÓN: En cada descripción, comienza o termina explicando brevemente por qué este lugar es perfecto para alguien que viaja en ${user.group} y busca ${guestStyles}.

  RESPUESTA JSON ESTRICTA:
  {
    "activities": [{ "title": "Nombre Real", "description": "...", "is_partner": false, "category_tag": "..." }],
    "food": [{ "title": "Nombre Real", "description": "...", "is_partner": false }],
    "transport": [{ "title": "Guía de...", "description": "Explicación paso a paso de compra y uso..." }]
  }
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: "Genera las recomendaciones personalizadas ahora.",
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error API:", error);
    return res
      .status(500)
      .json({ error: "Error generando opciones", details: error.message });
  }
}
