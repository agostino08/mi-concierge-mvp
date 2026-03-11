// How long to wait for the initial server response (covers Vercel cold starts).
const CONNECT_TIMEOUT_MS = 20_000;
// How long to wait between chunks during streaming.
// Resets on every chunk — so a slow-but-working 60s generation is fine.
// Only fires if the connection goes completely silent mid-stream.
const INACTIVITY_TIMEOUT_MS = 15_000;

export async function generateItinerary(hotel, user, lang, onChunk) {
  const controller = new AbortController();
  let timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

  try {
    const response = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotel, user, lang }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || "There was an error designing your guide.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    // Connection established — switch to inactivity timer.
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => controller.abort(), INACTIVITY_TIMEOUT_MS);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Reset inactivity timer on every chunk — generation can take as long as needed.
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => controller.abort(), INACTIVITY_TIMEOUT_MS);

      const chunk = decoder.decode(value, { stream: true });
      if (onChunk) onChunk(chunk);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("The request timed out. Please check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
