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
      uiStore.setError(e.message || "Error al cargar la información del hotel.");
    } finally {
      uiStore.setLoading(false);
    }
  }

  return {
    hotelData,
    fetchHotel
  };
});
