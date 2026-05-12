const PRICE_LABELS = ['Free', 'Budget-friendly', 'Moderate', 'Expensive', 'Very expensive'];

export function parseVenuesData(data) {
  return (data.results || [])
    .filter(p => p.business_status !== 'CLOSED_PERMANENTLY' && p.business_status !== 'CLOSED_TEMPORARILY')
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      rating: p.rating != null ? `${p.rating}/5` : 'No rating',
      address: p.formatted_address ?? 'Address unknown',
      price: PRICE_LABELS[p.price_level] ?? 'Price unknown',
    }));
}

export async function searchVenues({ city, query, max_results = 5 }) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return 'Venue search unavailable (no API key configured).';
  try {
    const q = encodeURIComponent(`${query} in ${city}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return `Venue search failed: ${data.status}`;
    }
    const venues = parseVenuesData(data).slice(0, max_results);
    if (!venues.length) return `No open venues found for "${query}" in ${city}.`;
    return JSON.stringify(venues);
  } catch (e) {
    return `Venue search unavailable: ${e.message}`;
  }
}
