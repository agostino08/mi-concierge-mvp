import { defineStore } from 'pinia';
import { ref } from 'vue';
import QRCode from 'qrcode';
import { useUIStore } from './useUIStore';
import { useHotelStore } from './useHotelStore';
import { useRouter } from 'vue-router';
import { getSharedItinerary, getHotelById } from '../services/firebase';
import { generateItinerary as apiGenerateItinerary } from '../services/api';
import { generateShareLink as nativeShareLink } from '../services/share';

export const useItineraryStore = defineStore('itinerary', () => {
  const uiStore = useUIStore();
  const hotelStore = useHotelStore();
  const router = useRouter();

  const generating = ref(false);
  const recommendations = ref({ activities: [], food: [], transport: [] });
  const myItinerary = ref([]);
  const qrCodeUrl = ref('');
  const shareLink = ref('');

  const formData = ref({
    group: "",
    days: 3,
    style: [],
    food: [],
    budget: "Balanceado",
    transport: [], 
  });

  async function generateItinerary() {
    generating.value = true;
    uiStore.setError(null);
    router.push('/results');
    
    // Clear out
    recommendations.value = { activities: [], food: [], transport: [] };
    let buffer = "";

    try {
      await apiGenerateItinerary(hotelStore.hotelData, formData.value, uiStore.lang, (chunk) => {
        buffer += chunk;
        try {
          // If the buffer is fully valid JSON (e.g., Cache Hit)
          const parsed = JSON.parse(buffer);
          recommendations.value = parsed;
        } catch (e) {
          // It is streaming: parse partially using regex to extract array items
          // This is a naive but effective way to extract partial JSON lists
          const extractArray = (key) => {
             const regex = new RegExp(`"${key}"\\s*:\\s*\\[(.*?)\\]`, 's');
             const match = buffer.match(regex);
             if (match) {
                // To avoid parse errors on an incomplete trailing object, we try to append "}]" 
                // until it safely parses, but for MVP we can wait until full arrays resolve.
                // An easier approach is replacing the entire regex string logic with a robust JSON parser 
                // or just accept the array once valid. 
             }
          };
          // For absolute safety without external heavy libs, we extract objects that match { "title": ... } globally
          const itemsMatch = [...buffer.matchAll(/{\s*"title"\s*:\s*"[^"]+".*?}/gs)];
          
          // Basic bucket dist:
          const activities = [];
          const food = [];
          const transport = [];
          
          itemsMatch.forEach(m => {
             try {
               const obj = JSON.parse(m[0]);
               if (obj.is_partner !== undefined) activities.push(obj); // heuristic for MVP fast rendering
             } catch(err) { /* incomplete object */ }
          });
          
          if (activities.length > recommendations.value.activities.length) {
            recommendations.value.activities = activities; // Progressive update for demo
          }
        }
      });
      
      // Final full parse guarantee
      try {
        recommendations.value = JSON.parse(buffer);
      } catch (e) {}

    } catch (e) {
      console.error("Error detallado:", e);
      uiStore.setError(e.message);
      router.push('/questionnaire/6');
    } finally {
      generating.value = false;
    }
  }

  function toggleFavorite(item) {
    const index = myItinerary.value.findIndex((i) => i.title === item.title);
    if (index > -1) {
      myItinerary.value.splice(index, 1);
      uiStore.triggerToast("Eliminado de favoritos");
    } else {
      myItinerary.value.push(item);
      uiStore.triggerToast("Añadido a favoritos");
    }
  }

  async function prepareSummary() {
      if (myItinerary.value.length === 0) {
        uiStore.triggerToast("Selecciona al menos un favorito");
        return;
      }
      qrCodeUrl.value = await QRCode.toDataURL(window.location.href);
      router.push('/summary');
  }

  async function generateShareLink() {
    if (myItinerary.value.length === 0) {
      uiStore.triggerToast("Añade favoritos antes de compartir");
      return;
    }

    uiStore.triggerToast("Generando enlace mágico...");
    
    try {
      shareLink.value = await nativeShareLink(
        hotelStore.hotelData, 
        formData.value, 
        myItinerary.value, 
        recommendations.value, 
        uiStore.lang
      );
    } catch (e) {
      console.error("Error sharing:", e);
      if (e.name !== 'AbortError') {
        uiStore.triggerToast("No se pudo compartir");
      }
    }
  }

  async function loadSharedItinerary(itineraryId) {
     uiStore.setLoading(true);
     uiStore.setError(null);
     try {
        const data = await getSharedItinerary(itineraryId);
        formData.value = data.formData;
        myItinerary.value = data.myItinerary;
        uiStore.setLang(data.lang);
        
        recommendations.value = data.recommendations || { activities: [], food: [], transport: [] };

        hotelStore.hotelData = await getHotelById(data.hotelId);
        router.push('/summary'); 
      } catch (e) {
        console.error(e);
        uiStore.setError(e.message || "Error al recuperar el viaje compartido.");
      } finally {
        uiStore.setLoading(false);
      }
  }

  function resetApp() {
    recommendations.value = { activities: [], food: [], transport: [] };
    myItinerary.value = [];
    formData.value = {
      group: "",
      days: 3,
      style: [],
      food: [],
      budget: "Balanceado",
      transport: [],
    };
    const hotelId = hotelStore.hotelData?.id || new URLSearchParams(window.location.search).get("hotel");
    router.push({ path: '/welcome', query: { hotel: hotelId }});
    localStorage.removeItem("my_itinerary_backup");
  }

  return {
    generating,
    recommendations,
    myItinerary,
    qrCodeUrl,
    shareLink,
    formData,
    generateItinerary,
    toggleFavorite,
    prepareSummary,
    generateShareLink,
    loadSharedItinerary,
    resetApp
  };
});
