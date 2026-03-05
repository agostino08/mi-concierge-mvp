import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { hotel, messages, lang } = req.body;
  if (!hotel || !hotel.name) return res.status(400).json({ error: "Missing hotel data" });

  // Build hotel context — only include fields that have data
  const hotelLines = [];
  if (hotel.checkin)       hotelLines.push(`- Check-in: ${hotel.checkin}`);
  if (hotel.checkout)      hotelLines.push(`- Check-out: ${hotel.checkout}`);
  if (hotel.wifi_name)     hotelLines.push(`- WiFi network: ${hotel.wifi_name}`);
  if (hotel.wifi_pass)     hotelLines.push(`- WiFi password: ${hotel.wifi_pass}`);
  if (hotel.breakfast)     hotelLines.push(`- Breakfast: ${hotel.breakfast}`);
  if (hotel.reception)     hotelLines.push(`- Reception phone: ${hotel.reception}`);
  if (hotel.pool)          hotelLines.push(`- Pool: ${hotel.pool}`);
  if (hotel.gym)           hotelLines.push(`- Gym: ${hotel.gym}`);
  if (hotel.spa)           hotelLines.push(`- Spa: ${hotel.spa}`);
  if (hotel.parking)       hotelLines.push(`- Parking: ${hotel.parking}`);
  if (hotel.restaurant)    hotelLines.push(`- Restaurant: ${hotel.restaurant}`);
  if (hotel.room_service)  hotelLines.push(`- Room service: ${hotel.room_service}`);
  if (hotel.facilities)    hotelLines.push(`- Facilities: ${hotel.facilities}`);
  if (hotel.address)       hotelLines.push(`- Address: ${hotel.address}`);
  if (hotel.description)   hotelLines.push(`- About: ${hotel.description}`);

  // Append custom FAQs
  if (hotel.faqs && hotel.faqs.length > 0) {
    hotel.faqs.forEach(f => {
      if (f.question && f.answer) {
        hotelLines.push(`- ${f.question}: ${f.answer}`);
      }
    });
  }

  const systemPrompt = `You are a professional digital concierge for ${hotel.name}, a hotel in ${hotel.city || "our city"}.

Hotel information:
${hotelLines.length ? hotelLines.join("\n") : "No additional information available at this time."}

Instructions:
1. Only answer using the hotel information provided above. Do not invent or assume details.
2. If the guest asks something you don't have information about, politely say so and suggest they contact the front desk.
3. Keep answers concise: 1–3 sentences maximum.
4. Always respond in the same language as the guest's message. The guest's app language is "${lang}" — use this as a strong hint if the intent is unclear.
5. Be warm, professional, and helpful — like a real luxury concierge.
6. Never mention that you are an AI unless directly asked.`;

  // Keep last 8 messages max to control token cost
  const trimmedHistory = (messages || []).slice(-8).map(m => ({
    role: m.role === "bot" ? "assistant" : "user",
    content: m.text,
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...trimmedHistory,
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "";
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: "AI unavailable", details: error.message });
  }
}
