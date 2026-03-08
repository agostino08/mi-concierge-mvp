const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Like translate.js but optimised for full sentences (chatbot topics, FAQ questions)
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { texts, targetLang } = req.body;
    if (!texts?.length || !targetLang || targetLang === "en") {
      return res.json({ translations: texts || [] });
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Translate these texts to the language with ISO code "${targetLang}". Return ONLY valid JSON in this exact format: {"translations": ["...", "..."]}. Preserve the exact order and array length. Keep translations natural and complete. Input: ${JSON.stringify(texts)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });
    const parsed = JSON.parse(completion.choices[0].message.content);
    res.json({ translations: parsed.translations || texts });
  } catch (e) {
    console.error("translate-text error:", e);
    res.status(200).json({ translations: req.body?.texts || [] });
  }
};
