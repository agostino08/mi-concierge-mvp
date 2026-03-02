import { useRouter } from 'vue-router';
import { useHotelStore } from '../stores/useHotelStore';
import { useItineraryStore } from '../stores/useItineraryStore';
import { useUIStore } from '../stores/useUIStore';

/**
 * Handles URL-based app initialization.
 * Extracted from App.vue onMounted so it can be tested independently.
 */
export function useAppInit() {
  const router = useRouter();
  const hotelStore = useHotelStore();
  const itineraryStore = useItineraryStore();
  const uiStore = useUIStore();

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const itineraryId = params.get('itinerary');
    const hotelId = params.get('hotel');

    if (itineraryId) {
      const success = await itineraryStore.loadSharedItinerary(itineraryId);
      if (success) router.push('/summary');
      return;
    }

    if (hotelId) {
      await hotelStore.fetchHotel(hotelId);
    } else {
      uiStore.setLoading(false);
      uiStore.setError('Hotel ID not found in the URL. Please use a valid hotel link.');
    }
  }

  return { init };
}
