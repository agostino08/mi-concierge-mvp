export function parseEventsData(data) {
  const events = data._embedded?.events || [];
  if (!events.length) return 'No events found for this period.';
  return events.slice(0, 10).map(e => {
    const date = e.dates?.start?.localDate ?? 'date TBC';
    const venue = e._embedded?.venues?.[0]?.name ?? 'venue TBC';
    return `${e.name} — ${date} at ${venue}`;
  }).join('\n');
}

export async function getLocalEvents({ city, date_from, date_to }) {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return 'Events data unavailable (no API key configured).';
  try {
    const url =
      `https://app.ticketmaster.com/discovery/v2/events.json` +
      `?city=${encodeURIComponent(city)}` +
      `&startDateTime=${date_from}T00:00:00Z` +
      `&endDateTime=${date_to}T23:59:59Z` +
      `&size=10&apikey=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    return parseEventsData(data);
  } catch (e) {
    return `Events data unavailable: ${e.message}`;
  }
}
