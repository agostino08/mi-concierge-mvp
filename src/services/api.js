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
