import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { generateItinerary as apiGenerateItinerary } from '../services/api';
import { useUIStore } from './useUIStore';

const EMPTY_RECOMMENDATIONS = () => ({ activities: [], food: [], transport: [] });

const TOOL_MESSAGES = {
  get_weather:      (input) => `Checking weather in ${input?.city ?? 'the city'}…`,
  get_local_events: (input) => `Looking for events in ${input?.city ?? 'the city'}…`,
  generating:       ()      => `Writing your personalised guide…`,
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
