import { useHotelStore } from '../stores/useHotelStore';

export function useExternalLinks() {
  const hotelStore = useHotelStore();

  function addToCalendar(item) {
    const title = encodeURIComponent(item.title);
    const details = encodeURIComponent(item.description);
    window.open(
      `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`,
      '_blank'
    );
  }

  function getGoogleMapsUrl(title) {
    const city = hotelStore.hotelData?.city || '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + ' ' + city)}`;
  }

  return { addToCalendar, getGoogleMapsUrl };
}
