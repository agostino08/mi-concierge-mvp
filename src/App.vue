<script setup>
import { ref, onMounted } from "vue";
import { db } from "./firebase";
// --- NUEVO: Añadimos collection, addDoc y serverTimestamp ---
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import QRCode from "qrcode";

import WelcomeScreen from "./components/WelcomeScreen.vue";
import QuestionnaireForm from "./components/QuestionnaireForm.vue";
import ResultsView from "./components/ResultsView.vue";
import FavoritesSummary from "./components/FavoritesSummary.vue";

const step = ref(0);
const lang = ref("es");
const loading = ref(true);
const generating = ref(false);
const hotelData = ref(null);
const error = ref(null);
const recommendations = ref({ activities: [], food: [], transport: [] });
const myItinerary = ref([]);
const qrCodeUrl = ref("");
const showToast = ref(false);
const toastMessage = ref("");
const shareLink = ref(""); // --- NUEVO ---

const formData = ref({
  group: "",
  days: 3,
  style: [],
  food: [],
  budget: "Balanceado",
  transport: [], 
});

const options = {
  group: ["Solo", "Pareja", "Familia", "Amigos", "Negocios"],
  style: [
    "Vida nocturna", "Naturaleza", "Montaña", "Playa", 
    "Terrazas & Rooftops", "Parques", "Música en vivo", 
    "Teatro & Espectáculos", "Tours Guiados", "Museos & Cultura", 
    "Experiencias Locales", "Shopping de Lujo", "Artesanía", 
    "Arquitectura", "Wellness & Spa", "Deportes", 
    "Historia", "Relax", "Gastronomía"
  ],
  food: [
    "Local / Tradicional", "Fusión", "Italiana", "Asiática", 
    "Mexicana", "Peruana", "Mediterránea", "Steakhouse", 
    "Panadería & Repostería", "De Autor / Michelin", 
    "Saludable / Sostenible", "Street Food", "Veggie / Vegano", 
    "Sea Food", "Brunch", "Vinos & Tapas"
  ],
  budget: ["Económico", "Balanceado", "Lujo"],
  transport: [
    "Transporte público", "Uber / Taxi", "Alquiler de Auto", 
    "Tren", "Barca / Ferry", "Bicicleta", "Caminando", "Scooter Eléctrico"
  ],
};

const triggerToast = (msg) => {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
};

const toggleFavorite = (item) => {
  const index = myItinerary.value.findIndex((i) => i.title === item.title);
  if (index > -1) {
    myItinerary.value.splice(index, 1);
    triggerToast("Eliminado de favoritos");
  } else {
    myItinerary.value.push(item);
    triggerToast("Añadido a favoritos");
  }
};

const fetchOptions = async () => {
  generating.value = true;
  error.value = null;
  step.value = 7;
  try {
    const response = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotel: hotelData.value, 
        user: formData.value,
        lang: lang.value,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || "Hubo un error al diseñar tu guía");
    }
    
    recommendations.value = await response.json();
  } catch (e) {
    console.error("Error detallado:", e);
    error.value = e.message;
    step.value = 6; 
  } finally {
    generating.value = false;
  }
};

// --- NUEVO: Función para Generar Link Compartible ---
const generateShareLink = async () => {
  // Evitamos guardar si no hay favoritos
  if (myItinerary.value.length === 0) {
    triggerToast("Añade favoritos antes de compartir");
    return;
  }

  triggerToast("Generando enlace único...");
  
  try {
    // 1. Guardamos en Firebase
    const docRef = await addDoc(collection(db, "shared_itineraries"), {
      hotelId: hotelData.value.id || new URLSearchParams(window.location.search).get("hotel"),
      formData: formData.value,
      myItinerary: myItinerary.value,
      lang: lang.value,
      createdAt: serverTimestamp()
    });

    // 2. Creamos la URL
    const url = new URL(window.location.origin);
    url.searchParams.set("itinerary", docRef.id);
    shareLink.value = url.toString();
    
    // 3. Copiamos al portapapeles
    await navigator.clipboard.writeText(shareLink.value);
    triggerToast("¡Enlace copiado! Envíalo a tus amigos.");
    
  } catch (e) {
    console.error("Error sharing:", e);
    triggerToast("Error al generar enlace");
  }
};

const prepareSummary = async () => {
  if (myItinerary.value.length === 0) {
    triggerToast("Selecciona al menos un favorito");
    return;
  }
  qrCodeUrl.value = await QRCode.toDataURL(window.location.href);
  step.value = 8;
};

// --- NUEVO: OnMounted Inteligente (Carga Hotel o Itinerario Compartido) ---
onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const itineraryId = params.get("itinerary"); // ¿Viene de un link compartido?
  const hotelId = params.get("hotel");         // ¿O es un flujo normal?

  // CASO A: Cargar Itinerario Compartido
  if (itineraryId) {
    loading.value = true;
    try {
      const itSnap = await getDoc(doc(db, "shared_itineraries", itineraryId));
      if (itSnap.exists()) {
        const data = itSnap.data();
        
        // Restauramos el estado
        formData.value = data.formData;
        myItinerary.value = data.myItinerary;
        lang.value = data.lang;

        // Cargamos el hotel asociado a ese itinerario
        const hotelSnap = await getDoc(doc(db, "hotels", data.hotelId));
        if (hotelSnap.exists()) {
          hotelData.value = { ...hotelSnap.data(), id: hotelSnap.id };
          step.value = 8; // Saltamos directo al resumen
        } else {
          error.value = "El hotel de este itinerario ya no existe.";
        }
      } else {
        error.value = "El enlace compartido ha expirado o no existe.";
      }
    } catch (e) {
      console.error(e);
      error.value = "Error al recuperar el viaje compartido.";
    } finally {
      loading.value = false;
    }
    return; // Terminamos aquí si es compartido
  }

  // CASO B: Flujo Normal (Cargar Hotel)
  if (!hotelId) {
    error.value = "ID de hotel no encontrado en la URL";
    loading.value = false;
    return;
  }

  try {
    const docSnap = await getDoc(doc(db, "hotels", hotelId));
    if (docSnap.exists()) {
      // Guardamos ID también por si acaso
      hotelData.value = { ...docSnap.data(), id: docSnap.id }; 
    } else {
      error.value = "Este hotel no existe en nuestra base de datos";
    }
  } catch (e) {
    console.error(e);
    error.value = "Error de conexión con la base de datos";
  } finally {
    loading.value = false;
  }
});

const resetApp = () => {
  recommendations.value = { activities: [], food: [], transport: [] };
  myItinerary.value = [];
  formData.value = {
    group: "",
    days: 3,
    style: [],
    food: [],
    budget: "Balanceado",
    transport: [],
  };
  step.value = 0; 
  localStorage.removeItem("my_itinerary_backup");
  // Limpiamos la URL al resetear para que no recargue el itinerario compartido
  window.history.pushState({}, document.title, window.location.pathname + "?hotel=" + (hotelData.value.id || ""));
};
</script>

<template>
  <div class="min-h-screen cosy-gradient text-stone-800 selection:bg-stone-200 font-sans">
    
    <div v-if="loading" class="flex flex-col items-center justify-center h-screen space-y-4">
      <div class="elegant-loader"></div>
      <p class="tracking-widest text-xs uppercase text-stone-400">Iniciando Experiencia</p>
    </div>

    <template v-else>
      <header v-if="hotelData" class="p-8 flex flex-col items-center sticky top-0 z-50 backdrop-blur-md bg-white/30">
        <img :src="hotelData.logo_url" class="h-10 mb-4 opacity-90 object-contain" alt="Logo Hotel" />
        
        <div v-if="step > 0 && step < 7" class="h-[2px] w-32 bg-stone-200 rounded-full overflow-hidden">
          <div class="h-full bg-stone-500 transition-all duration-700" :style="{ width: (step / 6) * 100 + '%' }"></div>
        </div>
      </header>

      <main class="max-w-xl mx-auto px-6 py-8 pb-24">
        <div v-if="error" class="bg-rose-50 border border-rose-100 text-rose-700 p-8 rounded-[2rem] text-center mb-6">
          <p class="font-medium">{{ error }}</p>
          <button @click="resetApp" class="mt-4 underline font-bold uppercase text-xs tracking-widest">Volver al inicio</button>
        </div>

        <transition name="page" mode="out-in">
          <WelcomeScreen
            v-if="step === 0"
            :hotelData="hotelData"
            @start="(l) => { lang = l; step++; }"
          />

          <QuestionnaireForm
            v-else-if="step >= 1 && step <= 6"
            :step="step"
            :lang="lang"
            :formData="formData"
            :options="options"
            @next="step++"
            @prev="step--"
            @submit="fetchOptions"
          />

          <ResultsView
            v-else-if="step === 7"
            :recommendations="recommendations"
            :myItinerary="myItinerary"
            :generating="generating"
            :hotelData="hotelData"
            @toggleFavorite="toggleFavorite"
            @goToSummary="prepareSummary"
            @reset="resetApp" 
          />

         <FavoritesSummary
            v-else-if="step === 8"
            :myItinerary="myItinerary"
            :hotelData="hotelData"
            @back="step = 7"
            @remove="(idx) => myItinerary.splice(idx, 1)"
          />
        </transition>
      </main>

      <transition name="toast">
        <div v-if="showToast" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-6 py-3 rounded-full text-[14px] font-bold uppercase tracking-widest shadow-2xl z-[100]">
          {{ toastMessage }}
        </div>
      </transition>
    </template>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap");
@import "tailwindcss";

:root {
  --champagne: #fdfcfb;
  --stone: #e2d1c3;
}

body {
  font-family: "Plus Jakarta Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.font-serif {
  font-family: "Playfair Display", serif;
}

.cosy-gradient {
  background: linear-gradient(135deg, var(--champagne) 0%, var(--stone) 100%);
  background-attachment: fixed;
}

/* UI Elements */
.btn-elegant {
  @apply px-8 py-5 bg-white/60 backdrop-blur-md border border-white rounded-3xl text-sm font-bold uppercase tracking-widest text-stone-700 
         hover:bg-white hover:shadow-xl transition-all active:scale-95;
}

.btn-dark {
  @apply px-8 py-5 bg-stone-700 text-white rounded-3xl text-lg font-bold uppercase tracking-widest 
         hover:bg-stone-800 shadow-lg transition-all active:scale-95;
}

.selection-card {
  @apply p-6 text-left text-[16px] rounded-3xl transition-all duration-300 font-medium bg-white/40 border border-white hover:bg-white/80 hover:shadow-lg;
}

.active-selection {
  @apply bg-stone-700 text-white hover:bg-stone-500 shadow-2xl scale-[1.02] border-transparent;
}

.base-selection {
  @apply bg-white/40 border border-white hover:bg-white/80 hover:shadow-lg;
}

.pill-card {
  @apply px-6 py-3 rounded-full text-[14px] font-bold uppercase tracking-widest transition-all border;
}

.pill-base {
  @apply bg-white/40 border-white text-stone-400 hover:bg-white;
}
.pill-active {
  @apply bg-stone-800 border-stone-800 text-white shadow-lg;
}

.elegant-range {
  @apply w-full h-[4px] bg-stone-300 appearance-none cursor-pointer accent-stone-600;
}

.elegant-loader {
  @apply w-10 h-10 border-[2px] border-stone-200 border-t-stone-800 rounded-full animate-spin;
}

/* Transiciones */
.page-enter-active,
.page-leave-active {
  transition: all 0.5s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

@media print {
  .no-pdf {
    display: none !important;
  }
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
