# Agent Tools Design — mi-concierge-mvp
**Date:** 2026-05-03  
**Status:** Approved

## Goal

Upgrade the itinerary generation endpoint from a one-shot GPT-4o-mini prompt to a real Anthropic agent loop using Claude Haiku with tool calling. The agent fetches live weather, local events, and venue candidates before writing recommendations — replacing hallucinated venue names with Google Places results.

---

## Approach

Option B: full SSE event stream with tool-call visibility. The agent loop runs server-side with `messages.create()` (non-streaming) for tool-call iterations. Each tool call and result is emitted as a typed SSE event so the frontend can show live progress. The final JSON is emitted as a single `event: content` after all tool calls complete.

---

## Backend Architecture

### Agent loop (`api/generate-itinerary.js` — full rewrite)

```
cache hit? ──yes──► emit event:content (cached JSON) → event:done → end
     │no
     ▼
while steps < MAX_STEPS (5):
  anthropic.messages.create(model, system, tools, messages)

  stop_reason === 'tool_use'
    ├─ emit event:tool_call  for each block (parallel execution follows)
    ├─ execute all tools in parallel (Promise.all)
    ├─ emit event:tool_result for each result
    ├─ append { role: 'assistant', content: response.content } to messages
    ├─ append { role: 'user', content: toolResults[] } to messages
    └─ loop

  stop_reason === 'end_turn'
    ├─ emit event:content (complete JSON text, single line)
    ├─ validate activities/food via Google Places (background, same as today)
    ├─ write to Firestore cache (background)
    └─ emit event:done → end
```

**Model:** `claude-haiku-4-5-20251001`  
**Max steps:** 5  
**Error handling:** all tool errors caught and returned as `content: "Error: <msg>"` in tool_result — never thrown. Claude gracefully skips or notes unavailable data.

### Tools

| File | API | Auth | Cost |
|---|---|---|---|
| `api/tools/weather.js` | Open-Meteo (geocoding + forecast) | None required | Free forever |
| `api/tools/events.js` | Ticketmaster Discovery v2 | `TICKETMASTER_API_KEY` | Free, 5k req/day |
| `api/tools/venues.js` | Google Places Text Search | `GOOGLE_PLACES_API_KEY` (existing) | Free quota |

### Tool schemas

**`get_weather(city: string)`**  
Returns a single human-readable string: current conditions + 3-day forecast summary. Claude uses this to flag bad-weather days in activity descriptions.

**`get_local_events(city: string, date_from: string, date_to: string)`**  
ISO date strings (YYYY-MM-DD). Claude computes these from today's date and `user.days` — today's date is injected into the system prompt as `TODAY: {date}` so the agent can calculate the stay window without hallucinating it. Returns a list of event name / date / venue summaries. Claude highlights relevant events in the activities section.

**`search_venues(city: string, query: string, max_results?: number)`**  
`max_results` defaults to 5. Claude constructs the query from guest interests and budget (e.g. `"vegan restaurants"`, `"rooftop bars"`, `"jazz clubs"`). Returns `[{name, rating, address, price_level}]` from Places Text Search. Claude must only recommend venues returned by this tool.

### System prompt

Shortened significantly vs. today. The "VERIFIED REAL PLACES" guardrails (7 rules) are removed — the tool enforces real venues. The interest→venue-type mapping is kept as query guidance. New structure:

```
ROLE + LANGUAGE + HOTEL CONTEXT + GUEST PROFILE   (same as today)

TOOLS:
- get_weather: call first, always. Use forecast to flag bad-weather days.
- get_local_events: call with guest stay dates. Highlight relevant events.
- search_venues: call once per interest category. Only recommend venues returned.

OUTPUT: after all tool calls, respond with ONLY valid JSON (same schema as today).
```

### Caching

Same Firestore cache keyed by SHA-256 hash of `{hotelId, group, days, style, food, budget, transport, lang}`. Model name (`claude-haiku-4-5-20251001`) added to hash payload — old OpenAI-generated entries won't match and rebuild naturally on first request.

### New environment variables

- `ANTHROPIC_API_KEY` — added to Production, Preview, Development ✓
- `TICKETMASTER_API_KEY` — added to Production, Preview, Development ✓

---

## SSE Protocol

Standard SSE format. Every message: `event:` line + `data:` line + blank line.

```
event: tool_call
data: {"name":"get_weather","input":{"city":"Barcelona"}}

event: tool_result
data: {"name":"get_weather","summary":"24°C sunny. Rain Friday. Clear weekend."}

event: tool_call
data: {"name":"search_venues","input":{"city":"Barcelona","query":"rooftop bars"}}

event: tool_result
data: {"name":"search_venues","summary":"Found 5 venues: Paradiso, Bar Calders..."}

event: content
data: {"activities":[...],"food":[...],"transport":[...]}

event: done
data: {}

event: error
data: {"message":"Rate limit exceeded"}
```

The `event: content` data is the complete JSON on a single line. The existing `JSON.parse(buffer)` in the store handles it immediately (same as today's cache-hit path).

---

## Frontend Changes

### `src/services/api.js`

Replaces raw text reader with SSE line parser. Accepts a callbacks object:

```js
generateItinerary(hotel, user, lang, {
  onToolCall(name, input),      // show "Checking weather..."
  onToolResult(name, summary),  // update status message
  onContent(jsonText),          // feed to JSON parser (same as today's onChunk)
  onError(message),
})
```

### `src/stores/useRecommendationsStore.js`

One new reactive ref: `agentStep` (string | null). Set to a human-readable message on each tool_call event (`"Checking weather in Barcelona…"`), updated on tool_result, cleared on done/error. Existing buffer/JSON parsing logic is unchanged — moves to `onContent` callback.

### `src/views/ResultsView.vue`

Loading state gains one line of dynamic text from `agentStep`:

```
⟳  Generating your guide...
   Checking weather in Barcelona…
   Found 3 events this weekend…
   Searching rooftop bars…
```

No structural changes to the UI.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Tool HTTP error | Return `"Error: <msg>"` as tool_result content. Claude skips or notes unavailable data. |
| Tool returns empty | Return `"No results found."` — Claude omits that section. |
| Agent hits MAX_STEPS | Emit `event: error`, close stream. Frontend shows existing error UI. |
| Final response not valid JSON | Store falls back to partial parse or throws — same as today. |
| Anthropic API error | Caught in outer try/catch, emit `event: error`, close stream. |
| Cache hit | Skip agent loop. Emit `event: content` + `event: done`. Rate limit still checked. |

---

## Files Changed

| File | Change |
|---|---|
| `api/generate-itinerary.js` | Full rewrite — Anthropic SDK, agent loop, SSE emitter |
| `api/tools/weather.js` | New — Open-Meteo geocoding + forecast |
| `api/tools/events.js` | New — Ticketmaster Discovery v2 |
| `api/tools/venues.js` | New — Google Places Text Search |
| `src/services/api.js` | SSE line parser, typed callbacks |
| `src/stores/useRecommendationsStore.js` | `agentStep` ref, new callback shape |
| `src/views/ResultsView.vue` | Show `agentStep` in loading state |
| `package.json` | Add `@anthropic-ai/sdk` |

`openai` package stays — used by `chat.js`, `translate.js`, `translate-text.js`, `scrape-hotel.js`.

---

## Out of Scope

- Streaming Claude's final text token-by-token (text arrives all at once after tool calls; visual progress comes from tool events instead)
- Migrating `chat.js`, `translate.js`, or `scrape-hotel.js` to Anthropic SDK
- Adding new UI pages or components beyond the loading state text
