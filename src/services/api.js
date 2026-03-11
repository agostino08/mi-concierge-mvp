const STREAM_TIMEOUT_MS = 30_000; // 30 seconds total — covers cold start + full generation

export async function generateItinerary(hotel, user, lang, onChunk) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
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
