import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
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
    const guestStyles = user.style && user.style.length > 0 ? user.style.join(", ") : "General";
    const guestFood = user.food && user.food.length > 0 ? user.food.join(", ") : "Local";
    const hotelPartners = hotel.partners && hotel.partners.length > 0 ? hotel.partners.join(", ") : "Ninguno";

    const systemPrompt = `
  Eres el Concierge de Lujo de "${hotel.name}" en ${hotel.city}. 
  Tu misión es inspirar al huésped diseñando una selección exclusiva de opciones.

  IDIOMA DE RESPUESTA: ${lang === "en" ? "Inglés" : "Español"}.

  PERFIL DEL HUÉSPED:
  - Viaja en: ${user.group}.
  - Intereses: ${guestStyles}.
  - Comida: ${guestFood}.
  - Presupuesto: ${user.budget}.
  - Transporte: ${user.transport}.

  INSTRUCCIONES:
  1. CATEGORÍA ACTIVIDADES: Basadas en ${guestStyles}. Mezcla iconos, secretos locales y gemas de la ciudad.
  2. CATEGORÍA GASTRONOMÍA: Basadas en ${guestFood} y presupuesto ${user.budget}.
  3. CATEGORÍA TRANSPORTE: Consejos expertos para moverse usando ${user.transport}.
      IMPORTANTE - CATEGORÍA TRANSPORTE: 
      No listes opciones genéricas. Explica LOGÍSTICA REAL para ${user.transport}:
      - Dónde comprar boletos/tickets exactamente.
      - Apps recomendadas para ese transporte en ${hotel.city}.
      - Costos aproximados y tipos de abonos recomendados.

  REGLAS:
  - No inventes coordenadas. Usa nombres comerciales exactos.
  - SOCIOS DEL HOTEL (PARTNERS):
    Lista de partners: ${hotelPartners}.
    Si recomiendas uno de estos lugares exactos, marca "is_partner": true.
  - Personaliza cada descripción explicando por qué encaja con sus gustos.

  REGLA UBICACIÓN:
  TODAS las recomendaciones deben estar ESTRICTAMENTE dentro de la ciudad de ${hotel.city}.
  PROHIBIDO recomendar lugares en otras provincias o paises. Si puedes recomendar de los alrededores y/o de pueblos cercanos que se pueda llegar en coche, bus o tren y volver en el dia.

  INSTRUCCIONES VISUALES:
  Para cada recomendación, genera un "image_keyword": una frase corta EN INGLÉS que describa visualmente el lugar para buscar una foto de stock (ej: "luxury sushi plate", "modern art museum interior", "cocktail bar rooftop night").


  RESPUESTA JSON ESTRICTA:
  {
    "activities": [{ "title": "Nombre", "description": "...", "is_partner": false, "category_tag": "..." }],
    "food": [{ "title": "Nombre", "description": "...", "is_partner": false }],
    "transport": [{ "title": "Guía de...", "description": "Explicación paso a paso de compra y uso..." }]
  }
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Genera las recomendaciones personalizadas ahora." },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return res.status(200).json(result);

  } catch (error) {
    console.error("Error API:", error);
    return res.status(500).json({ error: "Error generando opciones", details: error.message });
  }
}