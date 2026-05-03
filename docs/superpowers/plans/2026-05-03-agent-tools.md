# Agent Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the one-shot OpenAI itinerary endpoint with an Anthropic Claude Haiku agent loop that calls weather, events, and venue tools before writing recommendations.

**Architecture:** `api/generate-itinerary.js` runs a `while (steps < 5)` loop calling `anthropic.messages.create()`. On `stop_reason === 'tool_use'` it executes tools in parallel and feeds results back. On `stop_reason === 'end_turn'` it emits the final JSON via SSE. Three tool files live in `api/tools/`. The frontend SSE reader is updated to parse typed events (`tool_call`, `tool_result`, `content`, `done`, `error`) and the store exposes an `agentStep` string for live loading-screen feedback.

**Tech Stack:** `@anthropic-ai/sdk`, Open-Meteo (free, no key), Ticketmaster Discovery v2 (`TICKETMASTER_API_KEY`), Google Places Text Search (`GOOGLE_PLACES_API_KEY` — already set), Vitest, Vue 3 + Pinia.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `@anthropic-ai/sdk` |
| `api/tools/weather.js` | Create | Open-Meteo geocoding + forecast → human-readable string |
| `api/tools/events.js` | Create | Ticketmaster Discovery v2 → event list string |
| `api/tools/venues.js` | Create | Google Places Text Search → `[{name,rating,address,price}]` JSON string |
| `api/generate-itinerary.js` | Rewrite | Anthropic agent loop, SSE emitter, tool dispatcher |
| `src/services/api.js` | Rewrite | SSE line parser, typed callbacks, export `parseSseMessages` for tests |
| `src/stores/useRecommendationsStore.js` | Modify | Add `agentStep` ref, new callback shape |
| `src/views/ResultsView.vue` | Modify | Show `agentStep` in loading state |
| `src/tests/tools/weather.test.js` | Create | Unit test `parseWeatherData` |
| `src/tests/tools/events.test.js` | Create | Unit test `parseEventsData` |
| `src/tests/tools/venues.test.js` | Create | Unit test `parseVenuesData` |
| `src/tests/api.test.js` | Create | Unit test `parseSseMessages` |
| `src/tests/useRecommendationsStore.test.js` | Modify | Update mock shape, add `agentStep` tests |

---

## Task 1: Install @anthropic-ai/sdk

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the dependency**

In `package.json`, inside `"dependencies"`, add after the `"openai"` line:

```json
"@anthropic-ai/sdk": "^0.52.0",
```

- [ ] **Step 2: Install**

```bash
npm install
```

Expected: `added N packages` with no errors. `node_modules/@anthropic-ai/sdk` exists.

- [ ] **Step 3: Verify import works**

```bash
node -e "import('@anthropic-ai/sdk').then(m => console.log('ok', typeof m.default))"
```

Expected: `ok function`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @anthropic-ai/sdk"
```

---

## Task 2: Weather Tool

**Files:**
- Create: `api/tools/weather.js`
- Create: `src/tests/tools/weather.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/tests/tools/weather.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseWeatherData } from '../../../api/tools/weather.js';

describe('parseWeatherData', () => {
  const mockData = {
    current: { temperature_2m: 22.4, weathercode: 1, windspeed_10m: 10 },
    daily: {
      time: ['2026-05-03', '2026-05-04', '2026-05-05'],
      weathercode: [0, 61, 2],
      temperature_2m_max: [25, 20, 23],
      temperature_2m_min: [18, 15, 17],
    },
  };

  it('includes current temperature rounded to integer', () => {
    expect(parseWeatherData(mockData)).toContain('22°C');
  });

  it('maps weathercode 1 to "mainly clear"', () => {
    expect(parseWeatherData(mockData)).toContain('mainly clear');
  });

  it('includes all three forecast dates', () => {
    const result = parseWeatherData(mockData);
    expect(result).toContain('2026-05-03');
    expect(result).toContain('2026-05-04');
    expect(result).toContain('2026-05-05');
  });

  it('maps weathercode 61 to "light rain"', () => {
    expect(parseWeatherData(mockData)).toContain('light rain');
  });

  it('returns fallback string for unknown weathercode', () => {
    const data = { ...mockData, current: { temperature_2m: 20, weathercode: 999, windspeed_10m: 5 } };
    expect(parseWeatherData(data)).toContain('20°C');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/tests/tools/weather.test.js
```

Expected: FAIL — `Cannot find module '../../../api/tools/weather.js'`

- [ ] **Step 3: Create `api/tools/weather.js`**

```js
const WMO = {
  0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'foggy', 48: 'icy fog',
  51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow',
  80: 'showers', 81: 'moderate showers', 82: 'heavy showers',
  95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'thunderstorm with heavy hail',
};

export function parseWeatherData(data) {
  const c = data.current;
  const d = data.daily;
  const current = `${Math.round(c.temperature_2m)}°C, ${WMO[c.weathercode] ?? 'unknown conditions'}`;
  const forecast = d.time.map((date, i) => {
    const hi = Math.round(d.temperature_2m_max[i]);
    const lo = Math.round(d.temperature_2m_min[i]);
    return `${date}: ${hi}°C/${lo}°C, ${WMO[d.weathercode[i]] ?? 'unknown'}`;
  }).join(' | ');
  return `Now: ${current}. Forecast: ${forecast}`;
}

export async function getWeather({ city }) {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();
    if (!geoData.results?.length) return `Weather data unavailable for ${city}.`;
    const { latitude, longitude } = geoData.results[0];

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weathercode,windspeed_10m` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`
    );
    const forecastData = await forecastRes.json();
    return parseWeatherData(forecastData);
  } catch (e) {
    return `Weather data unavailable: ${e.message}`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/tests/tools/weather.test.js
```

Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add api/tools/weather.js src/tests/tools/weather.test.js
git commit -m "feat: add weather tool (Open-Meteo)"
```

---

## Task 3: Events Tool

**Files:**
- Create: `api/tools/events.js`
- Create: `src/tests/tools/events.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/tests/tools/events.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseEventsData } from '../../../api/tools/events.js';

describe('parseEventsData', () => {
  it('returns no-events message when _embedded is missing', () => {
    expect(parseEventsData({})).toBe('No events found for this period.');
  });

  it('returns no-events message when events array is empty', () => {
    expect(parseEventsData({ _embedded: { events: [] } })).toBe('No events found for this period.');
  });

  it('formats event name, date, and venue', () => {
    const data = {
      _embedded: {
        events: [{
          name: 'Jazz Night',
          dates: { start: { localDate: '2026-05-04' } },
          _embedded: { venues: [{ name: 'Palau de la Música' }] },
        }],
      },
    };
    const result = parseEventsData(data);
    expect(result).toContain('Jazz Night');
    expect(result).toContain('2026-05-04');
    expect(result).toContain('Palau de la Música');
  });

  it('handles missing venue gracefully', () => {
    const data = {
      _embedded: {
        events: [{ name: 'Concert', dates: { start: { localDate: '2026-05-04' } } }],
      },
    };
    expect(parseEventsData(data)).toContain('Concert');
    expect(parseEventsData(data)).toContain('venue TBC');
  });

  it('formats multiple events as separate lines', () => {
    const makeEvent = (name) => ({ name, dates: { start: { localDate: '2026-05-04' } } });
    const data = { _embedded: { events: [makeEvent('A'), makeEvent('B')] } };
    const lines = parseEventsData(data).split('\n');
    expect(lines).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/tests/tools/events.test.js
```

Expected: FAIL — `Cannot find module '../../../api/tools/events.js'`

- [ ] **Step 3: Create `api/tools/events.js`**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/tests/tools/events.test.js
```

Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add api/tools/events.js src/tests/tools/events.test.js
git commit -m "feat: add events tool (Ticketmaster Discovery v2)"
```

---

## Task 4: Venues Tool

**Files:**
- Create: `api/tools/venues.js`
- Create: `src/tests/tools/venues.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/tests/tools/venues.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseVenuesData } from '../../../api/tools/venues.js';

describe('parseVenuesData', () => {
  const mockResults = [
    { name: 'Bar Marsella', rating: 4.5, formatted_address: 'Carrer dels Escudellers, 53', price_level: 1, business_status: 'OPERATIONAL' },
    { name: 'Old Closed Bar', rating: 3.0, formatted_address: 'Some Street', price_level: 1, business_status: 'CLOSED_PERMANENTLY' },
    { name: 'Paradiso', rating: 4.8, formatted_address: 'Carrer de Rera Palau, 4', price_level: 3, business_status: 'OPERATIONAL' },
  ];

  it('filters out permanently closed venues', () => {
    const result = parseVenuesData({ results: mockResults });
    expect(result.every(v => v.name !== 'Old Closed Bar')).toBe(true);
  });

  it('returns name, rating string, address, and price label', () => {
    const result = parseVenuesData({ results: [mockResults[0]] });
    expect(result[0].name).toBe('Bar Marsella');
    expect(result[0].rating).toBe('4.5/5');
    expect(result[0].address).toBe('Carrer dels Escudellers, 53');
    expect(result[0].price).toBe('Budget-friendly');
  });

  it('maps price_level 3 to "Expensive"', () => {
    const result = parseVenuesData({ results: [mockResults[2]] });
    expect(result[0].price).toBe('Expensive');
  });

  it('handles missing rating', () => {
    const data = { results: [{ name: 'X', business_status: 'OPERATIONAL' }] };
    expect(parseVenuesData(data)[0].rating).toBe('No rating');
  });

  it('returns empty array when results is empty', () => {
    expect(parseVenuesData({ results: [] })).toEqual([]);
  });

  it('limits to max 5 results', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      name: `Venue ${i}`, rating: 4.0, business_status: 'OPERATIONAL', price_level: 1,
    }));
    expect(parseVenuesData({ results: many })).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/tests/tools/venues.test.js
```

Expected: FAIL — `Cannot find module '../../../api/tools/venues.js'`

- [ ] **Step 3: Create `api/tools/venues.js`**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/tests/tools/venues.test.js
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add api/tools/venues.js src/tests/tools/venues.test.js
git commit -m "feat: add venues tool (Google Places Text Search)"
```

---

## Task 5: SSE Parser — Update `src/services/api.js`

**Files:**
- Rewrite: `src/services/api.js`
- Create: `src/tests/api.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/tests/api.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseSseMessages } from '../services/api.js';

describe('parseSseMessages', () => {
  it('parses a single tool_call event', () => {
    const chunk = 'event: tool_call\ndata: {"name":"get_weather","input":{"city":"Barcelona"}}\n\n';
    const result = parseSseMessages(chunk);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ event: 'tool_call', data: { name: 'get_weather', input: { city: 'Barcelona' } } });
  });

  it('parses two events in one chunk', () => {
    const chunk =
      'event: tool_call\ndata: {"name":"get_weather","input":{}}\n\n' +
      'event: tool_result\ndata: {"name":"get_weather","summary":"24°C"}\n\n';
    expect(parseSseMessages(chunk)).toHaveLength(2);
  });

  it('ignores incomplete trailing message', () => {
    const chunk = 'event: content\ndata: {"activities":[],"food":[],"transport":[]}\n\nevent: done\n';
    expect(parseSseMessages(chunk)).toHaveLength(1);
    expect(parseSseMessages(chunk)[0].event).toBe('content');
  });

  it('returns empty array for blank input', () => {
    expect(parseSseMessages('')).toEqual([]);
    expect(parseSseMessages('\n\n')).toEqual([]);
  });

  it('parses done event with empty data', () => {
    const chunk = 'event: done\ndata: {}\n\n';
    const result = parseSseMessages(chunk);
    expect(result[0]).toEqual({ event: 'done', data: {} });
  });

  it('parses error event', () => {
    const chunk = 'event: error\ndata: {"message":"Rate limit exceeded"}\n\n';
    expect(parseSseMessages(chunk)[0].data.message).toBe('Rate limit exceeded');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/tests/api.test.js
```

Expected: FAIL — `parseSseMessages is not a function`

- [ ] **Step 3: Rewrite `src/services/api.js`**

```js
const CONNECT_TIMEOUT_MS = 20_000;
const INACTIVITY_TIMEOUT_MS = 15_000;

// Pure function — exported for unit tests.
// Splits a raw SSE buffer on \n\n boundaries and returns parsed {event, data} pairs.
// Incomplete trailing messages (no closing \n\n) are discarded.
export function parseSseMessages(buffer) {
  return buffer
    .split('\n\n')
    .filter(msg => msg.trim())
    .map(msg => {
      const lines = msg.split('\n');
      let event = null;
      let data = null;
      for (const line of lines) {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
        else if (line.startsWith('data: ')) data = line.slice(6);
      }
      if (!event || data === null) return null;
      try { return { event, data: JSON.parse(data) }; } catch { return null; }
    })
    .filter(Boolean);
}

export async function generateItinerary(hotel, user, lang, callbacks) {
  const { onToolCall, onToolResult, onContent, onError } = callbacks;
  const controller = new AbortController();
  let timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

  try {
    const response = await fetch('/api/generate-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotel, user, lang }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.details || 'There was an error designing your guide.');
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => controller.abort(), INACTIVITY_TIMEOUT_MS);

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => controller.abort(), INACTIVITY_TIMEOUT_MS);

      buffer += decoder.decode(value, { stream: true });

      // Split on double-newline (SSE message separator).
      // Keep last potentially-incomplete message in buffer.
      const boundary = buffer.lastIndexOf('\n\n');
      if (boundary === -1) continue;

      const complete = buffer.slice(0, boundary + 2);
      buffer = buffer.slice(boundary + 2);

      for (const { event, data } of parseSseMessages(complete)) {
        switch (event) {
          case 'tool_call':   onToolCall?.(data.name, data.input); break;
          case 'tool_result': onToolResult?.(data.name, data.summary); break;
          case 'content':     onContent?.(data); break;
          case 'error':       onError?.(data.message); break;
          case 'done':        break;
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/tests/api.test.js
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/api.js src/tests/api.test.js
git commit -m "feat: SSE line parser with typed event callbacks"
```

---

## Task 6: Update `useRecommendationsStore`

**Files:**
- Modify: `src/stores/useRecommendationsStore.js`
- Modify: `src/tests/useRecommendationsStore.test.js`

- [ ] **Step 1: Write the new/updated tests**

Replace the entire contents of `src/tests/useRecommendationsStore.test.js` with:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRecommendationsStore } from '../stores/useRecommendationsStore';
import { useUIStore } from '../stores/useUIStore';

vi.mock('../services/api', () => ({ generateItinerary: vi.fn() }));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('useRecommendationsStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with empty recommendations, generating=false, agentStep=null', () => {
    const store = useRecommendationsStore();
    expect(store.generating).toBe(false);
    expect(store.agentStep).toBeNull();
    expect(store.recommendations.activities).toEqual([]);
    expect(store.recommendations.food).toEqual([]);
    expect(store.recommendations.transport).toEqual([]);
  });

  it('resetRecommendations clears all arrays', () => {
    const store = useRecommendationsStore();
    store.recommendations.activities = [{ title: 'Test' }];
    store.resetRecommendations();
    expect(store.recommendations.activities).toEqual([]);
  });

  it('setRecommendations sets the data', () => {
    const store = useRecommendationsStore();
    store.setRecommendations({ activities: [{ title: 'Park Güell' }], food: [], transport: [] });
    expect(store.recommendations.activities[0].title).toBe('Park Güell');
  });

  it('setRecommendations with null falls back to empty', () => {
    const store = useRecommendationsStore();
    store.setRecommendations(null);
    expect(store.recommendations.activities).toEqual([]);
  });

  it('generateRecommendations sets error on API failure', async () => {
    const { generateItinerary } = await import('../services/api');
    generateItinerary.mockRejectedValueOnce(new Error('Network error'));

    const store = useRecommendationsStore();
    const uiStore = useUIStore();
    await store.generateRecommendations({}, {}, 'en');

    expect(store.generating).toBe(false);
    expect(uiStore.error).toBe('Network error');
  });

  it('generateRecommendations sets recommendations from onContent callback', async () => {
    const { generateItinerary } = await import('../services/api');
    const mockData = {
      activities: [{ title: 'Museum', description: 'Great art', is_partner: false }],
      food: [{ title: 'Tapas Bar', description: 'Local food', is_partner: true }],
      transport: [{ title: 'Metro', description: 'Fast & cheap' }],
    };

    generateItinerary.mockImplementationOnce(async (_hotel, _form, _lang, callbacks) => {
      callbacks.onContent(mockData);
    });

    const store = useRecommendationsStore();
    await store.generateRecommendations({}, {}, 'en');

    expect(store.recommendations.activities[0].title).toBe('Museum');
    expect(store.recommendations.food[0].title).toBe('Tapas Bar');
    expect(store.generating).toBe(false);
  });

  it('agentStep is null after generation completes', async () => {
    const { generateItinerary } = await import('../services/api');
    generateItinerary.mockImplementationOnce(async (_hotel, _form, _lang, callbacks) => {
      callbacks.onToolCall('get_weather', { city: 'Barcelona' });
      callbacks.onContent({ activities: [], food: [], transport: [] });
    });
    const store = useRecommendationsStore();
    await store.generateRecommendations({ city: 'Barcelona' }, {}, 'en');
    expect(store.agentStep).toBeNull();
  });

  it('generateRecommendations sets error from onError callback', async () => {
    const { generateItinerary } = await import('../services/api');
    generateItinerary.mockImplementationOnce(async (_hotel, _form, _lang, callbacks) => {
      callbacks.onError('Agent reached maximum steps');
    });
    const store = useRecommendationsStore();
    const uiStore = useUIStore();
    await store.generateRecommendations({}, {}, 'en');
    expect(uiStore.error).toBe('Agent reached maximum steps');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/tests/useRecommendationsStore.test.js
```

Expected: FAIL — `agentStep is not defined` and callback shape mismatch errors.

- [ ] **Step 3: Update `src/stores/useRecommendationsStore.js`**

Replace the entire file with:

```js
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { generateItinerary as apiGenerateItinerary } from '../services/api';
import { useUIStore } from './useUIStore';

const EMPTY_RECOMMENDATIONS = () => ({ activities: [], food: [], transport: [] });

const TOOL_MESSAGES = {
  get_weather:      (input) => `Checking weather in ${input?.city ?? 'the city'}…`,
  get_local_events: (input) => `Looking for events in ${input?.city ?? 'the city'}…`,
  search_venues:    (input) => `Searching for ${input?.query ?? 'venues'}…`,
};

export const useRecommendationsStore = defineStore('recommendations', () => {
  const uiStore = useUIStore();
  const generating = ref(false);
  const agentStep = ref(null);
  const recommendations = ref(EMPTY_RECOMMENDATIONS());

  watch(recommendations, (val) => {
    const hasData = val.activities.length > 0 || val.food.length > 0 || val.transport.length > 0;
    if (hasData) localStorage.setItem('mc_recs', JSON.stringify(val));
    else localStorage.removeItem('mc_recs');
  }, { deep: true });

  async function generateRecommendations(hotelData, formData, lang) {
    generating.value = true;
    agentStep.value = null;
    uiStore.setError(null);
    recommendations.value = EMPTY_RECOMMENDATIONS();

    try {
      await apiGenerateItinerary(hotelData, formData, lang, {
        onToolCall(name, input) {
          agentStep.value = TOOL_MESSAGES[name]?.(input) ?? `Calling ${name}…`;
        },
        onToolResult(_name, _summary) {
          // Keep the tool_call message visible until the next tool starts.
          // summary is available if more detail is needed in future.
        },
        onContent(data) {
          recommendations.value = {
            activities: data?.activities || [],
            food:       data?.food       || [],
            transport:  data?.transport  || [],
          };
        },
        onError(message) {
          uiStore.setError(message);
        },
      });
    } catch (e) {
      console.error('Error generating recommendations:', e);
      uiStore.setError(e.message);
    } finally {
      generating.value = false;
      agentStep.value = null;
    }
  }

  function resetRecommendations() {
    recommendations.value = EMPTY_RECOMMENDATIONS();
  }

  function setRecommendations(data) {
    recommendations.value = data || EMPTY_RECOMMENDATIONS();
  }

  return { generating, agentStep, recommendations, generateRecommendations, resetRecommendations, setRecommendations };
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/tests/useRecommendationsStore.test.js
```

Expected: 8 tests PASS

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm test
```

Expected: all 15+ tests PASS (old tests pass because the store interface is backward-compatible except the mock shape, which was updated in step 1)

- [ ] **Step 6: Commit**

```bash
git add src/stores/useRecommendationsStore.js src/tests/useRecommendationsStore.test.js
git commit -m "feat: add agentStep to recommendations store, new callback shape"
```

---

## Task 7: Rewrite `api/generate-itinerary.js`

**Files:**
- Rewrite: `api/generate-itinerary.js`

This is the full agent loop. It keeps rate limiting and Firebase admin init identical to today. The OpenAI import and `openai` instance are removed and replaced with the Anthropic client.

- [ ] **Step 1: Rewrite `api/generate-itinerary.js`**

Replace the entire file with:

```js
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { getWeather } from './tools/weather.js';
import { getLocalEvents } from './tools/events.js';
import { searchVenues } from './tools/venues.js';

// --- GOOGLE PLACES VALIDATION (kept from original — runs after agent, before caching) ---
async function validatePlace(name, city, apiKey) {
  try {
    const input = encodeURIComponent(`${name} ${city}`);
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${input}&inputtype=textquery&fields=business_status,rating,name&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK' || !data.candidates?.length) return null;
    const place = data.candidates[0];
    if (place.business_status === 'CLOSED_PERMANENTLY' || place.business_status === 'CLOSED_TEMPORARILY') return null;
    return { rating: place.rating || null };
  } catch (e) {
    console.warn(`Places error for "${name}":`, e.message);
    return { rating: null };
  }
}

async function validateItems(items, city, apiKey) {
  const results = await Promise.all(
    items.map(async (item) => {
      if (item.is_partner) return item;
      const v = await validatePlace(item.title, city, apiKey);
      if (v === null) return null;
      return { ...item, ...(v.rating ? { rating: v.rating } : {}) };
    })
  );
  return results.filter(Boolean);
}
// --- END GOOGLE PLACES VALIDATION ---

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  } catch (e) {
    console.warn('Firebase Admin not initialized. Caching disabled:', e.message);
  }
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_STEPS = 5;

const TOOLS = [
  {
    name: 'get_weather',
    description: 'Get current weather and 3-day forecast for the hotel city. Always call this first.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_local_events',
    description: 'Get upcoming local events (concerts, festivals, shows) in the city for the guest stay dates.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        date_from: { type: 'string', description: 'ISO date YYYY-MM-DD — start of guest stay' },
        date_to: { type: 'string', description: 'ISO date YYYY-MM-DD — end of guest stay' },
      },
      required: ['city', 'date_from', 'date_to'],
    },
  },
  {
    name: 'search_venues',
    description: 'Search Google Places for venues matching guest interests. Call once per interest category.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        query: { type: 'string', description: 'Search query e.g. "rooftop bars" or "vegan restaurants"' },
        max_results: { type: 'integer', description: 'Max results to return, default 5' },
      },
      required: ['city', 'query'],
    },
  },
];

async function executeTool(name, input) {
  switch (name) {
    case 'get_weather':      return getWeather(input);
    case 'get_local_events': return getLocalEvents(input);
    case 'search_venues':    return searchVenues(input);
    default:                 return `Unknown tool: ${name}`;
  }
}

function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting (unchanged from original)
  const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const ipKey = rawIp.replace(/[^a-zA-Z0-9]/g, '_');
  try {
    if (admin.apps.length) {
      const db = admin.firestore();
      const rlRef = db.collection('rate_limits').doc(ipKey);
      const now = Date.now();
      const snap = await rlRef.get();
      const data = snap.data();
      if (!data || now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
        await rlRef.set({ count: 1, windowStart: now });
      } else if (data.count >= MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests. Please try again in 10 minutes.' });
      } else {
        await rlRef.update({ count: data.count + 1 });
      }
    }
  } catch (e) {
    console.warn('Rate limit check failed (non-blocking):', e.message);
  }

  try {
    const { hotel, user, lang } = req.body;
    if (!hotel?.name) return res.status(400).json({ error: 'Incomplete hotel data' });

    // Cache check — model name is included in hash so old OpenAI entries don't match
    let db, cacheHash;
    try {
      db = admin.firestore();
      const hashPayload = JSON.stringify({
        hotelId: hotel.id,
        group: user.group,
        days: user.days,
        style: (user.style || []).sort().join(','),
        food: (user.food || []).sort().join(','),
        budget: user.budget,
        transport: (user.transport || []).sort().join(','),
        lang,
        model: 'claude-haiku-4-5-20251001',
      });
      cacheHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
      const cachedDoc = await db.collection('cached_itineraries').doc(cacheHash).get();
      if (cachedDoc.exists) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        sseWrite(res, 'content', cachedDoc.data().result);
        sseWrite(res, 'done', {});
        return res.end();
      }
    } catch (e) {
      console.warn('Cache check error:', e.message);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const today = new Date().toISOString().split('T')[0];
    const endDt = new Date();
    endDt.setDate(endDt.getDate() + (user.days - 1));
    const endDate = endDt.toISOString().split('T')[0];

    const guestStyles    = user.style?.length    > 0 ? user.style.join(', ')    : 'General sightseeing';
    const guestFood      = user.food?.length      > 0 ? user.food.join(', ')     : 'Local cuisine';
    const guestTransport = user.transport?.length > 0 ? user.transport.join(', '): 'Walking';

    const hotelContext = [
      hotel.hotel_category && `Category: ${hotel.hotel_category}`,
      hotel.hotel_stars    && `Rating: ${hotel.hotel_stars}`,
      hotel.neighborhood   && `Neighbourhood: ${hotel.neighborhood}`,
      hotel.description    && `About the hotel: ${hotel.description}`,
      hotel.ai_context     && `Local context: ${hotel.ai_context}`,
    ].filter(Boolean).join('\n');

    const hotelPartners = hotel.partners?.length > 0
      ? hotel.partners.map(p =>
          `- ${p.name} (${p.category}): ${p.description}${p.discount ? ' — Guest discount: ' + p.discount : ''}`
        ).join('\n')
      : null;

    const systemPrompt = `You are the expert concierge of "${hotel.name}", a ${hotel.hotel_category || 'hotel'} in ${hotel.city}. Deliver a hyper-personalised guide for this specific guest.

TODAY: ${today}

LANGUAGE: Write ALL JSON string values in the language for ISO code "${lang}". Every title, description, and category_tag must be fluent and natural — not a literal translation.

━━━ HOTEL CONTEXT ━━━
${hotelContext || `${hotel.name}, ${hotel.city}`}

━━━ GUEST PROFILE ━━━
- Traveling as: ${user.group}
- Stay: ${user.days} day${user.days > 1 ? 's' : ''} from ${today} to ${endDate}
- Interests: ${guestStyles}
- Food preferences: ${guestFood}
- Budget: ${user.budget}
- Getting around: ${guestTransport}

━━━ TOOL INSTRUCTIONS ━━━
1. Call get_weather("${hotel.city}") first. Use the forecast to flag bad-weather alternatives.
2. Call get_local_events("${hotel.city}", "${today}", "${endDate}"). Highlight relevant events as activities.
3. Call search_venues once per guest interest category. Form queries from interests + budget.
   ONLY recommend venues returned by this tool — never invent venue names.

Query guidance by interest:
- Nightlife → "cocktail bars", "rooftop bars evening", "nightclubs"
- Beach → "beach clubs", "surf schools"
- Nature → "nature reserves", "botanical gardens"
- Wellness & Spa → "spas", "yoga studios"
- Museums & Culture → "art museums", "cultural centres"
- Gastronomy → "food markets", "wine bars", "cooking classes"
- Live Music → "live music bars", "jazz clubs"
- Architecture → "architectural tours"
- Shopping → "luxury boutiques", "artisan markets"
(Use your judgement for other interests)

━━━ OUTPUT ━━━
After all tool calls, respond with ONLY valid JSON — no markdown, no code fences:
{
  "activities": [{"title": "Exact venue name from search results", "description": "2–3 sentences personalised to guest", "is_partner": false, "category_tag": "Short tag in ${lang}"}],
  "food":       [{"title": "Exact venue name from search results", "description": "2–3 sentences with cuisine, vibe, neighbourhood", "is_partner": false}],
  "transport":  [{"title": "Transport mode", "description": "Step-by-step guide with costs and apps"}]
}

Aim for ${Math.min(Math.max(3, Math.round(user.days * 2)), 10)} activities, ${Math.min(Math.max(2, Math.round(user.days * 1.5)), 7)} food items, 2–3 transport items.
${hotelPartners ? `\n━━━ HOTEL PARTNERS — PRIORITISE THESE ━━━\nThese partners are verified. Include where they genuinely match the guest profile and set "is_partner": true:\n${hotelPartners}` : ''}`;

    const messages = [{ role: 'user', content: 'Generate personalized recommendations for this guest.' }];
    let steps = 0;
    let finalText = '';

    while (steps < MAX_STEPS) {
      steps++;
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      if (response.stop_reason === 'end_turn') {
        finalText = response.content.find(b => b.type === 'text')?.text ?? '';
        try {
          const parsed = JSON.parse(finalText);
          sseWrite(res, 'content', parsed);
        } catch {
          sseWrite(res, 'error', { message: 'Could not parse AI response. Please try again.' });
          return res.end();
        }
        sseWrite(res, 'done', {});
        break;
      }

      if (response.stop_reason === 'tool_use') {
        const toolBlocks = response.content.filter(b => b.type === 'tool_use');

        for (const block of toolBlocks) {
          sseWrite(res, 'tool_call', { name: block.name, input: block.input });
        }

        const toolResults = await Promise.all(
          toolBlocks.map(async (block) => {
            try {
              const result = await executeTool(block.name, block.input);
              const summary = String(result).slice(0, 150);
              sseWrite(res, 'tool_result', { name: block.name, summary });
              return { type: 'tool_result', tool_use_id: block.id, content: String(result) };
            } catch (e) {
              const errMsg = `Error: ${e.message}`;
              sseWrite(res, 'tool_result', { name: block.name, summary: errMsg });
              return { type: 'tool_result', tool_use_id: block.id, content: errMsg };
            }
          })
        );

        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });
      }
    }

    if (steps >= MAX_STEPS && !finalText) {
      sseWrite(res, 'error', { message: 'Agent reached maximum steps without completing.' });
    }

    // Background: validate with Google Places, write to cache
    if (db && cacheHash && finalText) {
      try {
        const parsed = JSON.parse(finalText);
        const placesKey = process.env.GOOGLE_PLACES_API_KEY;
        if (placesKey) {
          const [validatedActivities, validatedFood] = await Promise.all([
            validateItems(parsed.activities || [], hotel.city, placesKey),
            validateItems(parsed.food || [], hotel.city, placesKey),
          ]);
          parsed.activities = validatedActivities;
          parsed.food = validatedFood;
        }
        await db.collection('cached_itineraries').doc(cacheHash).set({
          result: parsed,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        console.error('Validate/cache error:', e.message);
      }
    }

    return res.end();
  } catch (error) {
    console.error('Agent error:', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Error generating options', details: error.message });
    sseWrite(res, 'error', { message: error.message });
    return res.end();
  }
}
```

- [ ] **Step 2: Run full test suite (backend logic is not unit-tested here — verified by smoke test in Task 8)**

```bash
npm test
```

Expected: all tests PASS (no regressions)

- [ ] **Step 3: Commit**

```bash
git add api/generate-itinerary.js api/tools/
git commit -m "feat: rewrite generate-itinerary with Anthropic agent loop + SSE events"
```

---

## Task 8: Update ResultsView.vue Loading State

**Files:**
- Modify: `src/views/ResultsView.vue`

- [ ] **Step 1: Add `agentStep` computed to the script**

In `src/views/ResultsView.vue`, find the line (currently line 21):

```js
const hotelData = computed(() => hotelStore.hotelData);
```

Add immediately after it:

```js
const agentStep = computed(() => recommendationsStore.agentStep);
```

- [ ] **Step 2: Replace the static loading footer text with dynamic agent step**

Find the loading screen footer block (currently lines 129–133):

```html
        <div class="pt-10">
          <p class="text-white/40 text-[10px] uppercase tracking-[0.2em]">
            {{ $t('results.customizing', { city: hotelData?.city }) }}
          </p>
        </div>
```

Replace with:

```html
        <div class="pt-10 space-y-2">
          <transition name="slide-up" mode="out-in">
            <p
              v-if="agentStep"
              :key="agentStep"
              class="text-amber-400/70 text-[10px] uppercase tracking-[0.2em]"
            >
              {{ agentStep }}
            </p>
          </transition>
          <p class="text-white/40 text-[10px] uppercase tracking-[0.2em]">
            {{ $t('results.customizing', { city: hotelData?.city }) }}
          </p>
        </div>
```

- [ ] **Step 3: Run the dev server and do a smoke test**

```bash
npm run dev
```

Open the app with a real hotel slug (e.g. `http://localhost:5173/?hotel=<your-slug>`), fill in the questionnaire, and click Generate. Verify:

1. The loading screen appears.
2. You see the amber text cycle through: "Checking weather in [city]…" → "Looking for events in [city]…" → "Searching for [interest]…"
3. The recommendations render correctly after the agent finishes.
4. Open DevTools → Network → filter by `generate-itinerary` → EventStream tab: you should see `tool_call`, `tool_result`, `content`, `done` events.

- [ ] **Step 4: Run full test suite one last time**

```bash
npm test
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/ResultsView.vue
git commit -m "feat: show live agent step in loading screen"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** weather tool ✓, events tool ✓, venues tool ✓, agent loop ✓, SSE protocol ✓, `agentStep` store state ✓, loading screen UI ✓, model hash in cache ✓, today's date injected in prompt ✓
- [x] **No placeholders:** all steps have complete code
- [x] **Type consistency:** `parseSseMessages` exported and named consistently across api.js and api.test.js; `agentStep` ref named consistently in store, view, and tests; `TOOL_MESSAGES` keys match TOOLS `name` fields exactly
- [x] **openai package:** not touched — `chat.js`, `translate.js`, `translate-text.js`, `scrape-hotel.js` continue using it unchanged
