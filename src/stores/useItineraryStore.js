import { defineStore } from 'pinia';
import { ref } from 'vue';
import QRCode from 'qrcode';
import { useUIStore } from './useUIStore';
import { useHotelStore } from './useHotelStore';
import { useFormStore } from './useFormStore';
import { useRecommendationsStore } from './useRecommendationsStore';
import { getSharedItinerary, getHotelById } from '../services/firebase';
import { saveAndGetShareLink } from '../services/share';

export const useItineraryStore = defineStore('itinerary', () => {
  const uiStore = useUIStore();
  const hotelStore = useHotelStore();
  const formStore = useFormStore();
  const recommendationsStore = useRecommendationsStore();

  const myItinerary = ref([]);
  const qrCodeUrl = ref('');
  const shareLink = ref('');

  function toggleFavorite(item) {
    const index = myItinerary.value.findIndex((i) => i.title === item.title);
    if (index > -1) {
      myItinerary.value.splice(index, 1);
      uiStore.triggerToast('Removed from favorites');
    } else {
      myItinerary.value.push(item);
      uiStore.triggerToast('Added to favorites');
    }
  }

  function removeFromItinerary(idx) {
    myItinerary.value.splice(idx, 1);
  }

  // Returns true if ready to navigate to /summary, false otherwise
  async function prepareSummary() {
    if (myItinerary.value.length === 0) {
      uiStore.triggerToast('Select at least one favorite');
      return false;
    }
    qrCodeUrl.value = await QRCode.toDataURL(window.location.href);
    return true;
  }

  // Saves itinerary to Firebase and returns the shareable URL.
  // Navigation (native share / WhatsApp) is handled by the calling component.
  async function generateShareLink() {
    if (myItinerary.value.length === 0) {
      uiStore.triggerToast('Add favorites before sharing');
      return null;
    }
    uiStore.triggerToast('Generating magic link...');
    try {
      shareLink.value = await saveAndGetShareLink(
        hotelStore.hotelData,
        formStore.formData,
        myItinerary.value,
        recommendationsStore.recommendations,
        uiStore.lang
      );
      return shareLink.value;
    } catch (e) {
      console.error('Error generating share link:', e);
      if (e.name !== 'AbortError') uiStore.triggerToast('Could not generate link');
      return null;
    }
  }

  // Loads a shared itinerary from Firebase.
  // Returns true on success so the caller can navigate to /summary.
  async function loadSharedItinerary(itineraryId) {
    uiStore.setLoading(true);
    uiStore.setError(null);
    try {
      const data = await getSharedItinerary(itineraryId);
      formStore.setFormData(data.formData);
      myItinerary.value = data.myItinerary;
      uiStore.setLang(data.lang);
      recommendationsStore.setRecommendations(data.recommendations);
      hotelStore.setHotelData(await getHotelById(data.hotelId));
      return true;
    } catch (e) {
      console.error(e);
      uiStore.setError(e.message || 'Error loading shared itinerary.');
      return false;
    } finally {
      uiStore.setLoading(false);
    }
  }

  function resetItinerary() {
    myItinerary.value = [];
    qrCodeUrl.value = '';
    shareLink.value = '';
  }

  // Resets all app state and returns the hotelId for the caller to navigate
  function resetApp() {
    formStore.resetForm();
    recommendationsStore.resetRecommendations();
    resetItinerary();
    localStorage.removeItem('my_itinerary_backup');
    return hotelStore.hotelData?.id || new URLSearchParams(window.location.search).get('hotel');
  }

  return {
    myItinerary,
    qrCodeUrl,
    shareLink,
    toggleFavorite,
    removeFromItinerary,
    prepareSummary,
    generateShareLink,
    loadSharedItinerary,
    resetItinerary,
    resetApp,
  };
});
