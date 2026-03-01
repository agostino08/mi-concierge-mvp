import { saveSharedItinerary } from './firebase';

export async function generateShareLink(hotel, formData, myItinerary, recommendations, lang) {
  const payload = {
    hotelId: hotel.id || new URLSearchParams(window.location.search).get("hotel"),
    formData,
    myItinerary,
    recommendations,
    lang,
  };

  const itineraryId = await saveSharedItinerary(payload);

  const url = new URL(window.location.origin);
  url.searchParams.set("itinerary", itineraryId);
  const finalLink = url.toString();

  if (navigator.share) {
    await navigator.share({
      title: `Mi Guía en ${hotel?.name || ''}`,
      text: 'He creado esta guía personalizada. ¡Mira mis favoritos!',
      url: finalLink
    });
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent("Mira mi itinerario: " + finalLink)}`, "_blank");
  }

  return finalLink;
}
