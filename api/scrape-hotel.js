import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Strip HTML tags, scripts, styles, nav menus — keep visible text
function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid url' });
  }

  // Basic URL validation
  let parsedUrl;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Fetch the page
  let rawHtml;
  try {
    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MiConciergeBot/1.0; hotel onboarding assistant)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en,es;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return res.status(422).json({ error: `Website returned ${response.status}. Check the URL and try again.` });
    }
    rawHtml = await response.text();
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(422).json({ error: 'The website took too long to respond. Try again or fill the form manually.' });
    }
    return res.status(422).json({ error: 'Could not reach the website. Check the URL and try again.' });
  }

  // Extract visible text and truncate to keep within GPT context limits
  const pageText = extractText(rawHtml).slice(0, 14000);

  if (pageText.length < 100) {
    return res.status(422).json({
      error: 'This website is built with JavaScript rendering and cannot be scraped directly. Please fill the form manually.',
    });
  }

  // Ask GPT-4o-mini to extract structured hotel data
  const systemPrompt = `You are a hotel data extraction assistant. Extract hotel information from the provided website text and return ONLY a JSON object with these exact fields. Use null for fields not found.

Schema:
{
  "name": "Hotel name",
  "city": "City name only",
  "neighborhood": "Neighborhood or district (if mentioned)",
  "address": "Full street address",
  "maps_url": "Google Maps URL (if found on page)",
  "description": "A concise 2-3 sentence description of the hotel based on the page content",
  "checkin": "Check-in time (e.g. '3:00 PM' or '15:00')",
  "checkout": "Check-out time",
  "reception": "Reception/front desk hours",
  "breakfast": "Breakfast hours or description",
  "pool": "Pool description/hours if mentioned, else null",
  "gym": "Gym description/hours if mentioned, else null",
  "spa": "Spa description/hours if mentioned, else null",
  "parking": "Parking description/price if mentioned, else null",
  "restaurant": "Restaurant name and hours if mentioned, else null",
  "room_service": "Room service hours if mentioned, else null",
  "facilities_extra": "Any other notable facilities not captured above (comma-separated)",
  "faqs": [{ "question": "...", "answer": "..." }]
}

Rules:
- Return ONLY the JSON, no markdown fences, no explanation
- faqs: extract up to 5 real FAQ pairs if found on the page, otherwise return []
- Keep descriptions factual, based only on text provided
- For times, normalize to a readable format`;

  let extracted;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Website URL: ${parsedUrl.href}\n\nPage content:\n${pageText}` },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    extracted = JSON.parse(raw);
  } catch (err) {
    console.error('GPT extraction error:', err);
    return res.status(500).json({ error: 'AI extraction failed. Please fill the form manually.' });
  }

  return res.status(200).json({ data: extracted });
}
