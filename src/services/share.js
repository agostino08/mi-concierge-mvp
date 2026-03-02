import { saveSharedItinerary } from './firebase';

/**
 * Saves an itinerary to Firebase and returns the shareable URL.
 * UI side-effects (navigator.share, WhatsApp) are handled by the calling component.
 */
export async function saveAndGetShareLink(hotel, formData, myItinerary, recommendations, lang) {
  const payload = {
    hotelId: hotel.id || new URLSearchParams(window.location.search).get('hotel'),
    formData,
    myItinerary,
    recommendations,
    lang,
  };

  const itineraryId = await saveSharedItinerary(payload);

  const url = new URL(window.location.origin);
  url.searchParams.set('itinerary', itineraryId);
  return url.toString();
}
