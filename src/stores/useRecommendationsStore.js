import { defineStore } from 'pinia';
import { ref } from 'vue';
import { generateItinerary as apiGenerateItinerary } from '../services/api';
import { useUIStore } from './useUIStore';

const EMPTY_RECOMMENDATIONS = () => ({ activities: [], food: [], transport: [] });

/**
 * Extracts all complete JSON objects (balanced braces) from a string.
 */
function extractCompleteJsonObjects(str) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escape) { escape = false; continue; }
    if (char === '\\' && inString) { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (char === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { objects.push(JSON.parse(str.slice(start, i + 1))); } catch {}
        start = -1;
      }
    }
  }
  return objects;
}

/**
 * Finds the index of the matching closing ] for an opening [ at `start`.
 * Returns -1 if the array is not yet closed (still streaming).
 */
function findArrayCloseIndex(str, start) {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < str.length; i++) {
    const c = str[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/**
 * Extracts partial recommendations from an incomplete streaming JSON buffer.
 * Uses brace-counting bounded by each array's own closing bracket to prevent
 * food/transport objects from leaking into the activities array during streaming.
 */
function extractPartialRecommendations(buffer) {
  const result = EMPTY_RECOMMENDATIONS();
  for (const key of ['activities', 'food', 'transport']) {
    const keyIndex = buffer.lastIndexOf(`"${key}"`);
    if (keyIndex === -1) continue;
    const bracketIndex = buffer.indexOf('[', keyIndex);
    if (bracketIndex === -1) continue;
    const closeIndex = findArrayCloseIndex(buffer, bracketIndex);
    const sliceEnd = closeIndex !== -1 ? closeIndex : buffer.length;
    result[key] = extractCompleteJsonObjects(buffer.slice(bracketIndex + 1, sliceEnd));
  }
  return result;
}

export const useRecommendationsStore = defineStore('recommendations', () => {
  const uiStore = useUIStore();
  const generating = ref(false);
  const recommendations = ref(EMPTY_RECOMMENDATIONS());

  async function generateRecommendations(hotelData, formData, lang) {
    generating.value = true;
    uiStore.setError(null);
    recommendations.value = EMPTY_RECOMMENDATIONS();
    let buffer = '';

    try {
      await apiGenerateItinerary(hotelData, formData, lang, (chunk) => {
        buffer += chunk;

        // Try full parse first (handles cache-hit scenario where server sends complete JSON at once)
        try {
          recommendations.value = JSON.parse(buffer);
          return;
        } catch {}

        // Progressive partial parse — shows items as they stream in
        const partial = extractPartialRecommendations(buffer);
        const hasData =
          partial.activities.length > 0 ||
          partial.food.length > 0 ||
          partial.transport.length > 0;
        if (hasData) recommendations.value = partial;
      });

      // Final authoritative parse to ensure data integrity
      try {
        recommendations.value = JSON.parse(buffer);
      } catch {
        const hasPartial =
          recommendations.value.activities.length > 0 ||
          recommendations.value.food.length > 0;
        if (!hasPartial) throw new Error('Could not parse AI response. Please try again.');
      }
    } catch (e) {
      console.error('Error generating recommendations:', e);
      uiStore.setError(e.message);
    } finally {
      generating.value = false;
    }
  }

  function resetRecommendations() {
    recommendations.value = EMPTY_RECOMMENDATIONS();
  }

  function setRecommendations(data) {
    recommendations.value = data || EMPTY_RECOMMENDATIONS();
  }

  return { generating, recommendations, generateRecommendations, resetRecommendations, setRecommendations };
});
