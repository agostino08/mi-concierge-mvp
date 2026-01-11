<script setup>
import { ref, computed, onMounted } from "vue";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "qrcode";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min.js";

// === ESTADOS DE NAVEGACIÓN ===
const step = ref(0);
const lang = ref("es");
const loading = ref(true);
const generating = ref(false);
const hotelData = ref(null);
const error = ref(null); // Estado para errores
const recommendations = ref({ activities: [], food: [], transport: [] });
const myItinerary = ref([]);
const activeTab = ref("activities");
const qrCodeUrl = ref("");

// === FORMULARIO ===
const formData = ref({
  group: "",
  days: 3,
  style: [],
  food: [],
  budget: "Balanceado",
  transport: "Transporte público",
});

const options = {
  group: ["Solo", "Pareja", "Familia", "Amigos", "Negocios"],
  style: ["Vida nocturna", "Naturaleza", "Historia", "Arte", "Deportes", "Relax", "Shopping", "Gastronomía"],
  food: ["Local", "Fusión", "Veggie", "Sea food", "Fast Food", "Alta Cocina"],
  budget: ["Económico", "Balanceado", "Lujo"],
  transport: ["Transporte público", "Auto", "Tren", "Barca", "Bicicleta", "Caminando"],
};

const nextStep = () => step.value++;
const prevStep = () => step.value--;

const toggleSelection = (field, value) => {
  const arr = formData.value[field];
  const index = arr.indexOf(value);
  if (index > -1) arr.splice(index, 1);
  else arr.push(value);
};

// === GENERAR RECOMENDACIONES ===
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
    
    if (!response.ok) throw new Error("Error en la respuesta de la IA");
    
    const data = await response.json();
    // Validamos que la data traiga las propiedades necesarias
    recommendations.value = {
      activities: data.activities || [],
      food: data.food || [],
      transport: data.transport || []
    };
  } catch (e) {
    console.error("Error:", e);
    error.value = "Lo sentimos, no pudimos generar las opciones. Revisa tu conexión u API Key.";
  } finally {
    generating.value = false;
  }
};

const addToItinerary = (item) => {
  if (!myItinerary.value.find((i) => i.title === item.title)) {
    myItinerary.value.push(item);
  }
};

const removeFromItinerary = (index) => {
  myItinerary.value.splice(index, 1);
};

// CORREGIDO: Sintaxis de template string para Google Maps
const getGoogleMapsUrl = (title, city) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + " " + city)}`;
};

const generateQR = async () => {
  const itineraryData = JSON.stringify(myItinerary.value);
  const shareUrl = `${window.location.origin}${window.location.pathname}?hotel=${hotelData.value.id}&itinerary=${btoa(itineraryData)}`;
  qrCodeUrl.value = await QRCode.toDataURL(shareUrl);
};

const shareWhatsApp = () => {
  const text = `¡Mira el itinerario que he creado para mi estancia en ${hotelData.value.name}! ✨`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + window.location.href)}`);
};

const downloadPDF = () => {
  const element = document.getElementById("itinerary-pdf-content");
  const opt = {
    margin: 0.5,
    filename: "mi-itinerario.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };
  html2pdf().set(opt).from(element).save();
};

const goToSummary = () => {
  if (myItinerary.value.length > 0) {
    generateQR();
    step.value = 8;
  } else {
    alert("Por favor, añade al menos una actividad.");
  }
};

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const hotelId = params.get("hotel");
  if (!hotelId) {
    error.value = "Acceso denegado: Falta ID del hotel.";
    loading.value = false;
    return;
  }

  try {
    const docSnap = await getDoc(doc(db, "hotels", hotelId));
    if (docSnap.exists()) {
      hotelData.value = { id: hotelId, ...docSnap.data() };
    } else {
      error.value = "El hotel no existe.";
    }
  } catch (e) {
    error.value = "Error conectando con la base de datos.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#faf9f6] text-[#1a1a1a] font-light">
    <div v-if="loading" class="flex items-center justify-center h-screen">
      <div class="loader"></div>
    </div>

    <template v-else>
      <header v-if="hotelData" class="p-6 flex justify-between items-center">
        <img :src="hotelData.logo_url" class="h-8 grayscale" alt="Logo" />
        <div v-if="step > 0 && step < 7" class="h-1 w-24 bg-gray-200 rounded-full">
          <div class="h-full bg-black transition-all" :style="{ width: (step / 6) * 100 + '%' }"></div>
        </div>
      </header>

      <main class="max-w-2xl mx-auto px-6 py-12">
        <div v-if="error" class="bg-red-50 text-red-600 p-6 rounded-3xl text-center mb-6">
          {{ error }}
          <button @click="step = 0; error = null" class="block mx-auto mt-4 underline">Reintentar</button>
        </div>

        <transition name="fade" mode="out-in">
          <section v-if="step === 0" class="text-center space-y-8">
            <h1 class="text-5xl font-serif italic">{{ lang === 'es' ? 'Bienvenido' : 'Welcome' }}</h1>
            <div class="flex gap-4 justify-center">
              <button @click="lang='es'; nextStep()" class="btn-primary">Español</button>
              <button @click="lang='en'; nextStep()" class="btn-primary">English</button>
            </div>
          </section>
        </transition>

        <transition name="slide-up" mode="out-in">
          <section v-if="step >= 1 && step <= 6" class="space-y-10">
            <div v-if="step === 1">
              <h2 class="text-4xl font-serif mb-8 italic">{{ lang === 'es' ? '¿Con quién viajas?' : 'Travel group?' }}</h2>
              <div class="grid gap-3">
                <button v-for="o in options.group" :key="o" @click="formData.group=o; nextStep()" 
                  :class="formData.group === o ? 'bg-black text-white' : 'bg-white border'" class="selection-card">{{ o }}</button>
              </div>
            </div>

            <div v-if="step === 2">
              <h2 class="text-4xl font-serif mb-8 italic">{{ lang === 'es' ? '¿Cuántos días?' : 'How many days?' }}</h2>
              <input type="range" min="1" max="7" v-model="formData.days" class="w-full accent-black" />
              <p class="text-center text-6xl font-serif mt-4">{{ formData.days }}</p>
              <button @click="nextStep" class="w-full btn-black mt-8">Continuar</button>
            </div>

            <div v-if="step === 3">
              <h2 class="text-4xl font-serif mb-8 italic">{{ lang === 'es' ? '¿Qué te apetece?' : 'Interests?' }}</h2>
              <div class="flex flex-wrap gap-3">
                <button v-for="o in options.style" :key="o" @click="toggleSelection('style', o)" 
                  :class="formData.style.includes(o) ? 'bg-black text-white' : 'bg-white border'" class="pill-card">{{ o }}</button>
              </div>
              <button @click="nextStep" class="w-full btn-black mt-8" :disabled="formData.style.length === 0">Siguiente</button>
            </div>

            <div v-if="step === 4">
              <h2 class="text-4xl font-serif mb-8 italic">{{ lang === 'es' ? 'Tipo de comida' : 'Food type?' }}</h2>
              <div class="flex flex-wrap gap-3">
                <button v-for="o in options.food" :key="o" @click="toggleSelection('food', o)" 
                  :class="formData.food.includes(o) ? 'bg-black text-white' : 'bg-white border'" class="pill-card">{{ o }}</button>
              </div>
              <button @click="nextStep" class="w-full btn-black mt-8" :disabled="formData.food.length === 0">Siguiente</button>
            </div>

            <div v-if="step === 5">
              <h2 class="text-4xl font-serif mb-8 italic">{{ lang === 'es' ? 'Presupuesto' : 'Budget?' }}</h2>
              <div class="grid gap-3">
                <button v-for="o in options.budget" :key="o" @click="formData.budget=o; nextStep()" 
                  :class="formData.budget === o ? 'bg-black text-white' : 'bg-white border'" class="selection-card">{{ o }}</button>
              </div>
            </div>

            <div v-if="step === 6">
              <h2 class="text-4xl font-serif mb-8 italic">{{ lang === 'es' ? 'Transporte' : 'Transport?' }}</h2>
              <div class="grid grid-cols-2 gap-3">
                <button v-for="o in options.transport" :key="o" @click="formData.transport=o; fetchOptions()" 
                  class="selection-card border text-center">{{ o }}</button>
              </div>
            </div>

            <button v-if="step > 1" @click="prevStep" class="text-gray-400 text-sm underline block mx-auto">Volver</button>
          </section>
        </transition>

        <transition name="fade" mode="out-in">
          <section v-if="step === 7">
            <div v-if="generating" class="text-center py-20">
              <div class="loader mx-auto"></div>
              <p class="mt-8 font-serif italic text-xl">Curando tu experiencia...</p>
            </div>

            <div v-else class="space-y-8 animate-fade-in">
              <div class="bg-black text-white p-6 rounded-[2rem] shadow-2xl">
                <h3 class="font-serif italic mb-4">Mi Selección ({{ myItinerary.length }})</h3>
                <div class="flex gap-2 overflow-x-auto pb-2">
                  <div v-for="(item, idx) in myItinerary" :key="idx" class="bg-white/10 px-4 py-2 rounded-full text-xs flex items-center gap-2 flex-shrink-0">
                    {{ item.title }}
                    <button @click="removeFromItinerary(idx)">✕</button>
                  </div>
                </div>
                <button v-if="myItinerary.length > 0" @click="goToSummary" class="mt-4 w-full bg-white text-black py-3 rounded-xl font-bold text-sm">VER RESUMEN</button>
              </div>

              <div class="flex border-b">
                <button v-for="tab in ['activities', 'food', 'transport']" :key="tab" 
                  @click="activeTab = tab" 
                  :class="activeTab === tab ? 'border-b-2 border-black font-bold' : 'text-gray-400'"
                  class="flex-1 py-4 capitalize">
                  {{ lang === 'es' ? (tab === 'activities' ? 'Actividades' : tab === 'food' ? 'Comida' : 'Transporte') : tab }}
                </button>
              </div>

              <div class="grid gap-6">
                <div v-for="item in recommendations[activeTab]" :key="item.title" class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h4 class="text-xl font-bold mb-2">{{ item.title }}</h4>
                  <p class="text-gray-500 text-sm leading-relaxed mb-4">{{ item.description }}</p>
                  <div class="flex justify-between items-center pt-4 border-t border-gray-50">
                    <a :href="getGoogleMapsUrl(item.title, hotelData.city)" target="_blank" class="text-xs underline font-bold tracking-widest uppercase">Ver mapa</a>
                    <button @click="addToItinerary(item)" class="bg-gray-100 p-3 rounded-full hover:bg-black hover:text-white transition-colors">+</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </transition>

        <transition name="fade" mode="out-in">
          <section v-if="step === 8" class="text-center">
            <h2 class="text-4xl font-serif italic mb-6">¡Todo listo!</h2>
            <div id="itinerary-pdf-content" class="bg-white p-8 rounded-3xl shadow-xl inline-block mb-10 text-left w-full">
              <img :src="qrCodeUrl" class="w-40 h-40 mx-auto mb-6" alt="QR" />
              <div v-for="(item, idx) in myItinerary" :key="idx" class="mb-4 pb-4 border-b last:border-0">
                <p class="font-bold text-lg">{{ item.title }}</p>
                <p class="text-gray-500 text-sm">{{ item.description }}</p>
              </div>
            </div>
            <div class="flex gap-4 justify-center">
              <button @click="shareWhatsApp" class="btn-primary">WhatsApp</button>
              <button @click="downloadPDF" class="btn-primary">Descargar PDF</button>
            </div>
          </section>
        </transition>
      </main>
    </template>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap");
@import "tailwindcss";

.font-serif { font-family: "Playfair Display", serif; }
.btn-primary { @apply px-8 py-4 bg-white border border-gray-200 rounded-full hover:border-black transition-all font-medium text-sm; }
.btn-black { @apply px-8 py-5 bg-black text-white rounded-2xl font-bold text-sm; }
.selection-card { @apply p-6 text-left rounded-3xl text-lg font-medium transition-all; }
.pill-card { @apply px-6 py-3 rounded-full text-sm font-medium transition-all border; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.6s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(30px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-30px); }

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1a1a1a;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>