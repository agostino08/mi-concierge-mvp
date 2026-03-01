export async function generateItinerary(hotel, user, lang, onChunk) {
  const response = await fetch("/api/generate-itinerary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hotel, user, lang }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || "There was an error designing your guide.");
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (onChunk) onChunk(chunk);
  }
}
