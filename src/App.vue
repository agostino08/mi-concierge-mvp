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
const error = ref(null);
const recommendations = ref({ activities: [], food: [], transport: [] });
const myItinerary = ref([]); // Actúa como nuestra lista de Favoritos
const activeTab = ref("activities");
const qrCodeUrl = ref("");
const showToast = ref(false);
const toastMessage = ref("");

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

// === FUNCIONES DE FLUJO ===
const nextStep = () => step.value++;
const prevStep = () => step.value--;

const toggleSelection = (field, value) => {
  const arr = formData.value[field];
  const index = arr.indexOf(value);
  if (index > -1) arr.splice(index, 1);
  else arr.push(value);
};

const triggerToast = (msg) => {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
};

// === LÓGICA DE FAVORITOS ===
const toggleFavorite = (item) => {
  const index = myItinerary.value.findIndex((i) => i.title === item.title);
  if (index > -1) {
    myItinerary.value.splice(index, 1);
    triggerToast(lang.value === 'es' ? "Eliminado de favoritos" : "Removed from favorites");
  } else {
    myItinerary.value.push(item);
    triggerToast(lang.value === 'es' ? "Añadido a favoritos ✨" : "Added to favorites ✨");
  }
};

const isFavorite = (item) => myItinerary.value.some((i) => i.title === item.title);

// === API & EXTERNOS ===
const fetchOptions = async () => {
  generating.value = true;
  error.value = null;
  step.value = 7;
  try {
    const response = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotel: hotelData.value, user: formData.value, lang: lang.value }),
    });
    if (!response.ok) throw new Error("Error API");
    const data = await response.json();
    recommendations.value = data;
  } catch (e) {
    error.value = "Error al generar recomendaciones.";
  } finally {
    generating.value = false;
  }
};

const addToCalendar = (item) => {
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.description);
  const gCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
  window.open(gCalUrl, "_blank");
};

const getGoogleMapsUrl = (title) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + " " + hotelData.value.city)}`;

const goToSummary = async () => {
  if (myItinerary.value.length === 0) {
    triggerToast(lang.value === 'es' ? "Selecciona al menos un favorito" : "Select at least one favorite");
    return;
  }
  const shareUrl = window.location.href;
  qrCodeUrl.value = await QRCode.toDataURL(shareUrl);
  step.value = 8;
};

const downloadPDF = () => {
  const element = document.getElementById("itinerary-pdf-content");
  const opt = {
    margin: 10,
    filename: "Mis-Favoritos.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 3, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(element).save();
};

const shareWhatsApp = () => {
  const text = `Mis favoritos en ${hotelData.value.name}: ${myItinerary.value.map(i => i.title).join(", ")}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
};

onMounted(async () => {
  const hotelId = new URLSearchParams(window.location.search).get("hotel");
  if (!hotelId) { error.value = "ID de hotel no encontrado"; loading.value = false; return; }
  try {
    const docSnap = await getDoc(doc(db, "hotels", hotelId));
    if (docSnap.exists()) hotelData.value = docSnap.data();
    else error.value = "Hotel no encontrado";
  } catch (e) { error.value = "Error de conexión"; }
  finally { loading.value = false; }
});
</script>

<template>
  <div class="min-h-screen cosy-gradient text-stone-800 selection:bg-stone-200 font-sans">
    
    <div v-if="loading" class="flex flex-col items-center justify-center h-screen space-y-4">
      <div class="elegant-loader"></div>
      <p class="tracking-widest text-xs uppercase text-stone-400">Iniciando Experiencia</p>
    </div>

    <template v-else>
      <header v-if="hotelData" class="p-8 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-white/30">
        <img :src="hotelData.logo_url" class="h-10 mix-blend-multiply opacity-80" alt="Logo" />
        <div v-if="step > 0 && step < 7" class="h-[2px] w-32 bg-stone-200 rounded-full overflow-hidden">
          <div class="h-full bg-stone-500 transition-all duration-700" :style="{ width: (step / 6) * 100 + '%' }"></div>
        </div>
      </header>

      <main class="max-w-xl mx-auto px-6 py-8 pb-24">
        <div v-if="error" class="bg-rose-50 border border-rose-100 text-rose-700 p-8 rounded-[2rem] text-center mb-6">
          <p>{{ error }}</p>
          <button @click="step = 0; error = null" class="mt-4 underline font-bold uppercase text-xs tracking-widest">Reintentar</button>
        </div>

        <transition name="page" mode="out-in">
          <section v-if="step === 0" class="text-center space-y-12 py-12">
            <div class="space-y-4">
              <span class="text-xs font-bold tracking-[0.3em] uppercase text-stone-400">Concierge Privado</span>
              <h1 class="text-5xl font-serif leading-tight text-stone-900">{{ hotelData?.name }}</h1>
            </div>
            <div class="flex flex-col gap-4 max-w-xs mx-auto">
              <button @click="lang='es'; nextStep()" class="btn-elegant">Español</button>
              <button @click="lang='en'; nextStep()" class="btn-elegant">English</button>
            </div>
          </section>

          <section v-else-if="step >= 1 && step <= 6" class="space-y-12">
            <div v-if="step === 1">
              <h2 class="text-3xl font-serif text-stone-900 mb-8">{{ lang === 'es' ? '¿Con quién viajas?' : 'Who are you with?' }}</h2>
              <div class="grid gap-4">
                <button v-for="o in options.group" :key="o" @click="formData.group=o; nextStep()" :class="formData.group === o ? 'active-selection' : 'base-selection'" class="selection-card">{{ o }}</button>
              </div>
            </div>

            <div v-if="step === 2" class="text-center">
              <h2 class="text-3xl font-serif text-stone-900 mb-12 text-left">{{ lang === 'es' ? 'Estancia' : 'Stay' }}</h2>
              <div class="relative py-8">
                <input type="range" min="1" max="7" v-model="formData.days" class="elegant-range" />
                <div class="text-[8rem] font-serif leading-none text-stone-200 absolute inset-0 -z-10 flex justify-center items-center opacity-40">{{ formData.days }}</div>
              </div>
              <button @click="nextStep" class="btn-dark w-full">Continuar</button>
            </div>

            <div v-if="step === 3 || step === 4">
              <h2 class="text-3xl font-serif text-stone-900 mb-8">{{ step === 3 ? 'Intereses' : 'Gastronomía' }}</h2>
              <div class="flex flex-wrap gap-3">
                <button v-for="o in (step === 3 ? options.style : options.food)" :key="o" @click="toggleSelection(step === 3 ? 'style' : 'food', o)" :class="formData[step === 3 ? 'style' : 'food'].includes(o) ? 'pill-active' : 'pill-base'" class="pill-card">{{ o }}</button>
              </div>
              <button @click="nextStep" class="btn-dark w-full mt-12">Siguiente</button>
            </div>

            <div v-if="step === 5">
              <h2 class="text-3xl font-serif text-stone-900 mb-8">Presupuesto</h2>
              <div class="grid gap-4">
                <button v-for="o in options.budget" :key="o" @click="formData.budget=o; nextStep()" :class="formData.budget === o ? 'active-selection' : 'base-selection'" class="selection-card">{{ o }}</button>
              </div>
            </div>

            <div v-if="step === 6">
              <h2 class="text-3xl font-serif text-stone-900 mb-8">Movilidad</h2>
              <div class="grid grid-cols-2 gap-4">
                <button v-for="o in options.transport" :key="o" @click="formData.transport=o; fetchOptions()" class="base-selection selection-card text-center text-sm font-bold uppercase">{{ o }}</button>
              </div>
            </div>

            <button @click="prevStep" class="text-stone-400 text-xs font-bold uppercase tracking-widest block mx-auto">← Volver</button>
          </section>

          <section v-else-if="step === 7">
            <div v-if="generating" class="text-center py-32 space-y-6">
              <div class="elegant-loader mx-auto"></div>
              <p class="font-serif italic text-xl text-stone-500">Diseñando su experiencia...</p>
            </div>

            <div v-else class="space-y-12">
              <div class="bg-stone-800 text-stone-50 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
                <div class="flex justify-between items-center">
                  <h3 class="font-serif text-2xl">Mi Selección</h3>
                  <span class="bg-stone-600 px-3 py-1 rounded-full text-[10px] font-bold">{{ myItinerary.length }}</span>
                </div>
                <button v-if="myItinerary.length > 0" @click="goToSummary" class="w-full bg-white text-stone-900 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest">Ver Favoritos y Guardar</button>
              </div>

              <div class="flex p-1 bg-stone-200/50 rounded-2xl">
                <button v-for="tab in ['activities', 'food', 'transport']" :key="tab" @click="activeTab = tab" :class="activeTab === tab ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'" class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">{{ tab }}</button>
              </div>

              <div class="grid gap-6">
                <div v-for="item in recommendations[activeTab]" :key="item.title" class="bg-white/70 backdrop-blur-md border border-white/50 p-8 rounded-[2.5rem] shadow-sm relative group">
                  
                  <button v-if="activeTab !== 'transport'" @click="toggleFavorite(item)" class="absolute top-6 right-6 p-3 rounded-full transition-all" :class="isFavorite(item) ? 'bg-amber-100 text-amber-600 scale-110' : 'bg-stone-100 text-stone-300'">
                    <svg class="w-6 h-6" :fill="isFavorite(item) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>

                  <h4 class="text-2xl font-serif text-stone-800 mb-3 pr-10">{{ item.title }}</h4>
                  <p class="text-stone-500 text-sm leading-relaxed mb-8">{{ item.description }}</p>

                  <div v-if="activeTab !== 'transport'" class="flex gap-3">
                    <button @click="addToCalendar(item)" class="flex-1 py-4 bg-stone-100 text-stone-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200">Agendar</button>
                    <a :href="getGoogleMapsUrl(item.title)" target="_blank" class="p-4 bg-stone-700 text-white rounded-2xl hover:bg-stone-800 transition-all">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="step === 8" class="space-y-8">
            <div class="flex items-center justify-between">
              <button @click="step = 7" class="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors">← Volver</button>
              <h2 class="text-3xl font-serif text-stone-900">Mis Favoritos</h2>
            </div>

            <div id="itinerary-pdf-content" class="bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 border border-stone-100">
              <div class="flex justify-between items-center border-b border-stone-50 pb-6">
                 <img :src="hotelData?.logo_url" class="h-8 mix-blend-multiply" />
                 <span class="text-[10px] font-bold uppercase tracking-widest text-stone-400">Concierge Digital</span>
              </div>
              
              <div class="space-y-8">
                <div v-for="(item, idx) in myItinerary" :key="idx" class="relative group">
                  <h5 class="font-serif text-xl text-stone-800 mb-2">{{ item.title }}</h5>
                  <p class="text-stone-400 text-sm leading-relaxed">{{ item.description }}</p>
                  <button @click="myItinerary.splice(idx,1)" class="absolute -right-2 top-0 text-rose-300 hover:text-rose-500 no-pdf">✕</button>
                </div>
              </div>

              <div class="flex justify-center pt-8 border-t border-stone-50">
                <img :src="qrCodeUrl" class="w-32 h-32 opacity-80" alt="QR" />
              </div>
            </div>

            <div class="flex flex-col gap-4 max-w-xs mx-auto">
              <button @click="shareWhatsApp" class="btn-dark">Compartir WhatsApp</button>
              <button @click="downloadPDF" class="btn-elegant">Descargar PDF</button>
            </div>
          </section>
        </transition>
      </main>

      <transition name="toast">
        <div v-if="showToast" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-2xl z-[100]">
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

body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
.font-serif { font-family: 'Playfair Display', serif; }

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
  @apply px-8 py-5 bg-stone-700 text-white rounded-3xl text-sm font-bold uppercase tracking-widest 
         hover:bg-stone-800 shadow-lg transition-all active:scale-95;
}

.selection-card {
  @apply p-6 text-left rounded-3xl transition-all duration-300 font-medium bg-white/40 border border-white hover:bg-white/80 hover:shadow-lg;
}

.active-selection {
  @apply bg-stone-800 text-white shadow-2xl scale-[1.02] border-transparent;
}

.pill-card {
  @apply px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border;
}

.pill-base { @apply bg-white/40 border-white text-stone-400 hover:bg-white; }
.pill-active { @apply bg-stone-800 border-stone-800 text-white shadow-lg; }

.elegant-range {
  @apply w-full h-[2px] bg-stone-300 appearance-none cursor-pointer accent-stone-600;
}

.elegant-loader {
  @apply w-10 h-10 border-[2px] border-stone-200 border-t-stone-800 rounded-full animate-spin;
}

/* Transiciones */
.page-enter-active, .page-leave-active { transition: all 0.5s ease; }
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-to { opacity: 0; transform: translateY(-10px); }

.toast-enter-active, .toast-leave-active { transition: all 0.4s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 20px); }

@media print { .no-pdf { display: none !important; } }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>