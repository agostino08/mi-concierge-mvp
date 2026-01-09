<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import html2pdf from 'html2pdf.js';
import QrcodeVue from 'qrcode.vue';
import { useGeolocation } from '@vueuse/core'; // Para la distancia real

// === ESTADOS REACTIVOS ===
const loading = ref(true);
const generating = ref(false);
const hotelData = ref(null);
const itinerary = ref(null);
const error = ref(null);
const showShareModal = ref(false); // Para el QR y WhatsApp

// === FORMULARIO DE PREFERENCIAS ===
const formData = ref({
  people: '2',
  days: 3,
  group: 'Pareja',
  activity_style: 'Explorar ciudad',
  food_type: 'Local',
  transport: 'Transporte público',
});

// Opciones predefinidas para el formulario (lo que el usuario puede elegir)
const formOptions = {
  people: ['1', '2', '3', '4', '5', 'Más de 5'],
  group: ['Solo', 'Pareja', 'Familia con niños', 'Amigos', 'Trabajo/Negocios'],
  activity_style: ['Vida nocturna', 'Madrugador (Early bird)', 'Naturaleza', 'Explorar ciudad', 'Historia', 'Arquitectura', 'Arte', 'Deportes', 'Relajación', 'Compras'],
  food_type: ['Fast food', 'Fusión', 'Local/Tradicional', 'Vegano/Vegetariano', 'Comida de mar', 'Gourmet', 'Económico'],
  transport: ['Transporte público', 'Coche', 'Bicicleta', 'A pie', 'Barca'],
};

// === LOCALIZACIÓN DEL USUARIO ===
const { coords, located, error: geoError } = useGeolocation();

// === PROPIEDADES COMPUTADAS ===
const currentLoadingImage = ref('');
const currentLoadingText = ref('');

const backgroundStyle = computed(() => {
  if (hotelData.value && hotelData.value.main_color) {
    return {
      backgroundColor: hotelData.value.main_color,
      color: getContrastColor(hotelData.value.main_color)
    };
  }
  return {};
});

const getContrastColor = (hexcolor) => {
  if (!hexcolor) return '#000000'; // Default
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

const getDynamicTextColor = computed(() => {
  if (hotelData.value && hotelData.value.main_color) {
    return getContrastColor(hotelData.value.main_color);
  }
  return '#000000';
});

// === FUNCIONES ===
// Carga los datos del hotel y gestiona el error
onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const hotelId = params.get('hotel');

  if (!hotelId) {
    error.value = "URL Inválida: No se especificó el ID del hotel. Asegúrate de usar '?hotel=tu_id_de_hotel'";
    loading.value = false;
    return;
  }

  try {
    const docRef = doc(db, "hotels", hotelId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      hotelData.value = docSnap.data();
      // Inicia el carrusel de imágenes/textos de carga
      startLoadingCarousel();
    } else {
      error.value = `Hotel "${hotelId}" no encontrado en nuestra base de datos.`;
    }
  } catch (e) {
    error.value = "Error al conectar con la base de datos: " + e.message;
  } finally {
    loading.value = false;
  }
});

// Carrusel para la pantalla de carga
let loadingCarouselInterval;
const startLoadingCarousel = () => {
  let imageIndex = 0;
  let textIndex = 0;
  const updateContent = () => {
    if (hotelData.value.loading_images && hotelData.value.loading_images.length > 0) {
      currentLoadingImage.value = hotelData.value.loading_images[imageIndex];
      imageIndex = (imageIndex + 1) % hotelData.value.loading_images.length;
    }
    if (hotelData.value.loading_texts && hotelData.value.loading_texts.length > 0) {
      currentLoadingText.value = hotelData.value.loading_texts[textIndex];
      textIndex = (textIndex + 1) % hotelData.value.loading_texts.length;
    }
  };
  updateContent(); // Muestra el primero inmediatamente
  loadingCarouselInterval = setInterval(updateContent, 4000); // Cambia cada 4 segundos
};

// Llama a la API para generar el itinerario
const createItinerary = async () => {
  generating.value = true;
  itinerary.value = null;
  error.value = null;
  
  if (loadingCarouselInterval) clearInterval(loadingCarouselInterval); // Detiene el carrusel

  try {
    const response = await fetch('/api/generate-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotel: hotelData.value,
        user: formData.value
      })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error desconocido al generar itinerario.');
    }

    const data = await response.json();
    if (data.itinerary) {
      itinerary.value = data.itinerary;
    } else {
      error.value = "No se pudo generar un itinerario. Intenta con otras preferencias.";
    }
  } catch (e) {
    error.value = "Hubo un problema: " + e.message;
    console.error(e);
  } finally {
    generating.value = false;
    startLoadingCarousel(); // Reinicia el carrusel si el usuario vuelve a la pantalla de preferencias
  }
};

// Navegación a Google Maps
const openGoogleMaps = (coordinates, placeName) => {
  if (coordinates) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${coordinates}(${encodeURIComponent(placeName)})`, '_blank');
  } else {
    alert('Coordenadas no disponibles para este lugar.');
  }
};

// Compartir por WhatsApp
const shareOnWhatsApp = () => {
  if (itinerary.value) {
    const shareText = `¡Hola! He generado un itinerario increíble para mi viaje a ${hotelData.value.city} con el concierge de ${hotelData.value.name}. Échale un vistazo: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  }
};

// Generar PDF
const generatePdf = () => {
  const element = document.getElementById('itinerary-pdf-content'); // ID del div a convertir
  html2pdf().from(element).save(`${hotelData.value.name}_Itinerario.pdf`);
};

// Función para calcular distancia real si la ubicación del usuario está disponible
const calculateRealDistance = (activityCoords) => {
  if (!located.value || !coords.value || !activityCoords) return 'N/A';
  
  const [lat1, lon1] = [coords.value.latitude, coords.value.longitude];
  const [lat2, lon2] = activityCoords.split(',').map(Number);

  // Implementación básica de la fórmula de Haversine para distancia en km
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distancia en km
  
  return `${distance.toFixed(1)} km`;
};

</script>

<template>
  <div :style="backgroundStyle" class="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative transition-colors duration-500">
    <header v-if="hotelData" class="w-full max-w-2xl flex justify-center py-4 px-2 sm:px-4 bg-white bg-opacity-90 rounded-b-xl shadow-md z-10 sticky top-0">
      <img :src="hotelData.logo_url" alt="Logo del Hotel" class="h-16 object-contain">
    </header>

    <div class="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 sm:p-8 md:p-10 my-8 relative z-0">
      
      <div v-if="error" class="text-red-600 font-bold text-center py-4">{{ error }}</div>

      <div v-else-if="loading" class="flex flex-col items-center justify-center py-10">
        <div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
        <p class="text-xl font-semibold text-gray-700">Cargando perfil del hotel...</p>
      </div>

      <div v-else-if="!itinerary && !generating" class="transition-opacity duration-500 ease-in-out opacity-100">
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6 text-center">
          Tu aventura en <span :style="{ color: hotelData.main_color }">{{ hotelData.city }}</span> comienza aquí
        </h2>
        <p class="text-gray-600 mb-8 text-center text-lg">
          Cuéntanos tus preferencias y tu concierge personal te creará un itinerario a medida.
        </p>

        <form @submit.prevent="createItinerary" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="block text-gray-700 text-sm font-semibold mb-2">¿Cuántas personas?</label>
            <select v-model="formData.people" class="form-select">
              <option v-for="option in formOptions.people" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="block text-gray-700 text-sm font-semibold mb-2">¿Cuántos días?</label>
            <select v-model="formData.days" class="form-select">
              <option v-for="n in 7" :key="n" :value="n">{{ n }} Días</option>
            </select>
          </div>
          
          <div class="form-group md:col-span-2">
            <label class="block text-gray-700 text-sm font-semibold mb-2">Tipo de viaje</label>
            <div class="flex flex-wrap gap-2">
              <button type="button" v-for="option in formOptions.group" :key="option" 
                      @click="formData.group = option" 
                      :class="{'btn-option-active': formData.group === option, 'btn-option-inactive': formData.group !== option}"
                      :style="formData.group === option ? { backgroundColor: hotelData.main_color, color: getContrastColor(hotelData.main_color) } : {}"
              >
                {{ option }}
              </button>
            </div>
          </div>

          <div class="form-group md:col-span-2">
            <label class="block text-gray-700 text-sm font-semibold mb-2">Estilo de actividades</label>
            <div class="flex flex-wrap gap-2">
              <button type="button" v-for="option in formOptions.activity_style" :key="option" 
                      @click="formData.activity_style = option" 
                      :class="{'btn-option-active': formData.activity_style === option, 'btn-option-inactive': formData.activity_style !== option}"
                      :style="formData.activity_style === option ? { backgroundColor: hotelData.main_color, color: getContrastColor(hotelData.main_color) } : {}"
              >
                {{ option }}
              </button>
            </div>
          </div>

          <div class="form-group md:col-span-2">
            <label class="block text-gray-700 text-sm font-semibold mb-2">Tipo de comida preferida</label>
            <div class="flex flex-wrap gap-2">
              <button type="button" v-for="option in formOptions.food_type" :key="option" 
                      @click="formData.food_type = option" 
                      :class="{'btn-option-active': formData.food_type === option, 'btn-option-inactive': formData.food_type !== option}"
                      :style="formData.food_type === option ? { backgroundColor: hotelData.main_color, color: getContrastColor(hotelData.main_color) } : {}"
              >
                {{ option }}
              </button>
            </div>
          </div>

          <div class="form-group md:col-span-2">
            <label class="block text-gray-700 text-sm font-semibold mb-2">Transporte preferido</label>
            <div class="flex flex-wrap gap-2">
              <button type="button" v-for="option in formOptions.transport" :key="option" 
                      @click="formData.transport = option" 
                      :class="{'btn-option-active': formData.transport === option, 'btn-option-inactive': formData.transport !== option}"
                      :style="formData.transport === option ? { backgroundColor: hotelData.main_color, color: getContrastColor(hotelData.main_color) } : {}"
              >
                {{ option }}
              </button>
            </div>
          </div>

          <button type="submit" :disabled="generating" 
                  :style="{ backgroundColor: hotelData.main_color, color: getContrastColor(hotelData.main_color) }"
                  class="btn-primary md:col-span-2">
            {{ generating ? 'Creando tu itinerario...' : 'Generar mi itinerario' }}
          </button>
        </form>
      </div>

      <div v-else-if="generating" class="flex flex-col items-center justify-center py-10 text-center transition-opacity duration-500 ease-in-out opacity-100">
        <div class="relative w-full max-w-xs h-48 rounded-lg overflow-hidden mb-6 shadow-lg">
          <img :src="currentLoadingImage" alt="Cargando imagen" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out opacity-100">
          <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
          <p class="absolute bottom-4 left-4 right-4 text-white text-xl font-bold z-10 animate-pulse">{{ currentLoadingText }}</p>
        </div>
        <p class="text-xl sm:text-2xl font-semibold text-gray-700 mt-4">Tu concierge personal está perfeccionando cada detalle...</p>
        <div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mt-6" 
             :style="{ borderTopColor: hotelData.main_color }"></div>
      </div>

      <div v-else-if="itinerary" class="results-section transition-opacity duration-500 ease-in-out opacity-100">
        <button @click="itinerary = null" 
                :style="{ color: hotelData.main_color }"
                class="flex items-center text-sm font-medium mb-6 hover:underline">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Volver / Cambiar preferencias
        </button>
        
        <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4 text-center">
          ¡Tu itinerario está listo!
        </h2>
        <p class="text-gray-600 mb-8 text-center text-lg">
          Explora las recomendaciones que tu concierge ha preparado para ti.
        </p>

        <div class="flex flex-wrap justify-center gap-4 mb-8">
            <button @click="shareOnWhatsApp" :style="{ backgroundColor: hotelData.secondary_color, color: getContrastColor(hotelData.secondary_color) }" class="btn-action">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" alt="WhatsApp" class="h-5 w-5 mr-2">
                Compartir por WhatsApp
            </button>
            <button @click="generatePdf" :style="{ backgroundColor: hotelData.secondary_color, color: getContrastColor(hotelData.secondary_color) }" class="btn-action">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Guardar como PDF
            </button>
            <button @click="showShareModal = true" :style="{ backgroundColor: hotelData.secondary_color, color: getContrastColor(hotelData.secondary_color) }" class="btn-action">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 16h-1.5a2 2 0 01-2-2V7.5M14 6l4-4m0 0l4 4m-4-4v10a4 4 0 01-4 4H6a4 4 0 01-4-4V6a4 4 0 014-4h8a4 4 0 014 4z"></path></svg>
                Código QR
            </button>
        </div>

        <div id="itinerary-pdf-content" class="space-y-8">
            <div v-for="day in itinerary" :key="day.day" class="day-card bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <span :style="{ backgroundColor: hotelData.main_color, color: getDynamicTextColor }" class="rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold mr-3">
                        {{ day.day }}
                    </span>
                    {{ day.title }}
                </h3>
                <div class="relative border-l-2 border-dashed border-gray-300 ml-4 pl-4">
                    <div v-for="(act, index) in day.activities" :key="index" class="activity flex items-start mb-6">
                        <div class="flex-shrink-0 w-3 h-3 rounded-full absolute -left-[7px] transform -translate-y-1/2" 
                             :style="{ backgroundColor: hotelData.main_color, top: 'calc(50% + 8px)' }"></div>
                        <div class="flex-grow pl-4 py-1" :class="{'bg-yellow-50 bg-opacity-70 border-l-4 border-yellow-400 rounded-lg p-3': act.is_partner}">
                            <div class="flex items-center justify-between mb-1">
                                <h4 class="font-semibold text-lg text-gray-900">{{ act.title }}</h4>
                                <span v-if="act.is_partner" class="badge-partner" 
                                      :style="{ backgroundColor: hotelData.secondary_color, color: getContrastColor(hotelData.secondary_color) }">
                                    🌟 Recomendado Hotel
                                </span>
                            </div>
                            <p class="text-gray-700 text-sm mb-2">{{ act.description }}</p>
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                                <span v-if="act.time" class="flex items-center">
                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {{ act.time }}
                                </span>
                                <span v-if="act.distance_from_hotel_km" class="flex items-center">
                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {{ act.distance_from_hotel_km }} km del hotel
                                </span>
                                <span v-if="located && act.coordinates" class="flex items-