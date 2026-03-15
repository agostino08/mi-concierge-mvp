import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getHotelById, getHotelBySlug } from '../services/firebase';
import { useUIStore } from './useUIStore';

export const useHotelStore = defineStore('hotel', () => {
  const hotelData = ref(null);
  const uiStore = useUIStore();

  async function fetchHotel(hotelParam) {
    uiStore.setLoading(true);
    uiStore.setError(null);
    try {
      // Slugs contain hyphens; Firestore auto-generated IDs never do
      const fetcher = hotelParam.includes('-') ? getHotelBySlug(hotelParam) : getHotelById(hotelParam);
      hotelData.value = await fetcher;
      // Persist hotel param so the page can be refreshed without losing hotel context
      if (hotelData.value?.id) localStorage.setItem('mc_hotel', hotelParam);
    } catch (e) {
      console.error(e);
      uiStore.setError(e.message || 'Error loading hotel information.');
    } finally {
      uiStore.setLoading(false);
    }
  }

  // Explicit setter to replace direct external mutation (e.g., from loadSharedItinerary)
  function setHotelData(data) {
    hotelData.value = data;
  }

  return { hotelData, fetchHotel, setHotelData };
});
