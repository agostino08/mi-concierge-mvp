import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getHotelById } from '../services/firebase';
import { useUIStore } from './useUIStore';

export const useHotelStore = defineStore('hotel', () => {
  const hotelData = ref(null);
  const uiStore = useUIStore();

  async function fetchHotel(hotelId) {
    uiStore.setLoading(true);
    uiStore.setError(null);
    try {
      hotelData.value = await getHotelById(hotelId);
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
