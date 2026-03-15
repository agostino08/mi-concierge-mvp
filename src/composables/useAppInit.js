import { useRouter } from 'vue-router';
import { useHotelStore } from '../stores/useHotelStore';
import { useItineraryStore } from '../stores/useItineraryStore';
import { useUIStore } from '../stores/useUIStore';
import { useFormStore } from '../stores/useFormStore';
import { useRecommendationsStore } from '../stores/useRecommendationsStore';

/**
 * Handles URL-based app initialization and session restore.
 * Extracted from App.vue onMounted so it can be tested independently.
 *
 * Session restore strategy:
 * - All session data lives in localStorage under mc_* keys.
 * - If the hotel param matches the saved mc_hotel, we pre-restore all state
 *   BEFORE fetchHotel releases the loading screen, so components mount with
 *   the correct data already in the stores.
 * - We also navigate to the saved route while loading=true to avoid any flash.
 */
export function useAppInit() {
  const router = useRouter();
  const hotelStore = useHotelStore();
  const itineraryStore = useItineraryStore();
  const uiStore = useUIStore();
  const formStore = useFormStore();
  const recommendationsStore = useRecommendationsStore();

  function clearSession() {
    ['mc_hotel', 'mc_recs', 'mc_form', 'mc_itinerary', 'mc_route', 'mc_chat'].forEach(k => localStorage.removeItem(k));
  }

  function restoreSession() {
    try {
      const savedRecs = localStorage.getItem('mc_recs');
      if (savedRecs) recommendationsStore.setRecommendations(JSON.parse(savedRecs));
    } catch { /* ignore corrupt data */ }

    try {
      const savedForm = localStorage.getItem('mc_form');
      if (savedForm) formStore.setFormData(JSON.parse(savedForm));
    } catch { /* ignore corrupt data */ }

    try {
      const savedItinerary = localStorage.getItem('mc_itinerary');
      if (savedItinerary) itineraryStore.setItinerary(JSON.parse(savedItinerary));
    } catch { /* ignore corrupt data */ }
  }

  async function init() {
    // Skip hotel init for standalone pages that don't need hotel context
    const path = window.location.pathname;
    if (path === '/admin' || path.startsWith('/onboard')) {
      uiStore.setLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const itineraryId = params.get('itinerary');
    const urlHotelParam = params.get('hotel');

    if (itineraryId) {
      const success = await itineraryStore.loadSharedItinerary(itineraryId);
      if (success) router.push('/summary');
      return;
    }

    const savedHotelParam = localStorage.getItem('mc_hotel');
    const hotelParam = urlHotelParam || savedHotelParam;

    if (!hotelParam) {
      uiStore.setLoading(false);
      uiStore.setError('Hotel ID not found in the URL. Please use a valid hotel link.');
      return;
    }

    // Returning to the same hotel → pre-restore session before loading screen disappears
    const isSameHotel = !!savedHotelParam && savedHotelParam === hotelParam;

    if (isSameHotel) {
      // Restore all state synchronously while loading=true (no component has mounted yet).
      // fetchHotel's finally block sets loading=false, scheduling a Vue re-render as a
      // microtask. Our synchronous restore here runs first, so every component that mounts
      // after the loading screen is lifted already sees the correct store state.
      restoreSession();

      // Navigate to the saved route while still under the loading veil (no visible flash).
      const savedRoute = localStorage.getItem('mc_route');
      if (savedRoute && (
        savedRoute.startsWith('/results') ||
        savedRoute.startsWith('/summary') ||
        savedRoute.startsWith('/questionnaire')
      )) {
        await router.replace(savedRoute);
      }
    } else if (savedHotelParam) {
      // User opened a different hotel — wipe the stale session
      clearSession();
    }

    await hotelStore.fetchHotel(hotelParam);
  }

  return { init };
}
