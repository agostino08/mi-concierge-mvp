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
  style: [
    "Vida nocturna",
    "Naturaleza",
    "Historia",
    "Arte",
    "Deportes",
    "Relax",
    "Shopping",
    "Gastronomía",
  ],
  food: ["Local", "Fusión", "Veggie", "Sea food", "Fast Food", "Alta Cocina"],
  budget: ["Económico", "Balanceado", "Lujo"],
  transport: [
    "Transporte público",
    "Auto",
    "Tren",
    "Barca",
    "Bicicleta",
    "Caminando",
  ],
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
    recommendations.value = {
      activities: data.activities || [],
      food: data.food || [],
      transport: data.transport || [],
    };
  } catch (e) {
    console.error("Error:", e);
    error.value =
      "Lo sentimos, no pudimos generar las opciones. Revisa tu conexión u API Key.";
  } finally {
    generating.value = false;
  }
};

// Añade esto cerca de tus otras funciones (como fetchOptions)
const addToCalendar = (item) => {
  const title = encodeURIComponent(`Cita: ${item.title}`);
  const description = encodeURIComponent(
    `${item.description}\n\nRecomendado por el Concierge de ${hotelData.value.name}`
  );
  const location = encodeURIComponent(`${item.title}, ${hotelData.value.city}`);

  // Genera link para Google Calendar (puedes ajustar fecha/hora si lo deseas)
  const gCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&location=${location}`;

  window.open(gCalUrl, "_blank");
};

const addToItinerary = (item) => {
  if (!myItinerary.value.find((i) => i.title === item.title)) {
    myItinerary.value.push(item);
  }
};

const removeFromItinerary = (index) => {
  myItinerary.value.splice(index, 1);
};

const getGoogleMapsUrl = (title, city) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    title + " " + city
  )}`;
};

const generateQR = async () => {
  const itineraryData = JSON.stringify(myItinerary.value);
  const shareUrl = `${window.location.origin}${
    window.location.pathname
  }?hotel=${hotelData.value.id}&itinerary=${btoa(itineraryData)}`;
  qrCodeUrl.value = await QRCode.toDataURL(shareUrl);
};

const shareWhatsApp = () => {
  const text = `¡Mira mi itinerario en ${hotelData.value.name}! ✨`;
  window.open(
    `https://wa.me/?text=${encodeURIComponent(
      text + " " + window.location.href
    )}`
  );
};

const downloadPDF = () => {
  const element = document.getElementById("itinerary-pdf-content");
  const opt = {
    margin: 0.5,
    filename: "itinerario-lujo.pdf",
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
  <div class="min-h-screen cosy-gradient text-stone-800 selection:bg-stone-200">
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center h-screen space-y-4"
    >
      <div class="elegant-loader"></div>
      <p class="font-sans tracking-widest text-xs uppercase text-stone-400">
        Iniciando Experiencia
      </p>
    </div>

    <template v-else>
      <header
        v-if="hotelData"
        class="p-8 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md bg-white/30"
      >
        <img
          :src="hotelData.logo_url"
          class="h-10 mix-blend-multiply opacity-80"
          alt="Hotel Logo"
        />
        <div
          v-if="step > 0 && step < 7"
          class="h-[2px] w-32 bg-stone-200 rounded-full overflow-hidden"
        >
          <div
            class="h-full bg-stone-500 transition-all duration-700 ease-in-out"
            :style="{ width: (step / 6) * 100 + '%' }"
          ></div>
        </div>
      </header>

      <main class="max-w-xl mx-auto px-6 py-8 pb-24">
        <div
          v-if="error"
          class="bg-rose-50 border border-rose-100 text-rose-700 p-8 rounded-[2rem] text-center mb-6 animate-in fade-in slide-in-from-top-4"
        >
          <p class="font-medium">{{ error }}</p>
          <button
            @click="
              step = 0;
              error = null;
            "
            class="mt-4 text-sm font-bold uppercase tracking-widest underline decoration-2 underline-offset-4"
          >
            Reintentar
          </button>
        </div>

        <transition name="page" mode="out-in">
          <section v-if="step === 0" class="text-center space-y-12 py-12">
            <div class="space-y-4">
              <span
                class="text-xs font-bold tracking-[0.3em] uppercase text-stone-400"
                >Concierge Privado</span
              >
              <h1 class="text-5xl font-serif leading-tight text-stone-900">
                {{ hotelData?.name }}
              </h1>
            </div>
            <div class="flex flex-col gap-4 max-w-xs mx-auto">
              <button
                @click="
                  lang = 'es';
                  nextStep();
                "
                class="btn-elegant"
              >
                Español
              </button>
              <button
                @click="
                  lang = 'en';
                  nextStep();
                "
                class="btn-elegant"
              >
                English
              </button>
            </div>
          </section>
        </transition>

        <transition name="page" mode="out-in">
          <section v-if="step >= 1 && step <= 6" class="space-y-12">
            <div v-if="step === 1">
              <h2 class="text-3xl font-serif text-stone-900 mb-8">
                {{
                  lang === "es"
                    ? "¿Con quién viajas?"
                    : "Who are you traveling with?"
                }}
              </h2>
              <div class="grid gap-4">
                <button
                  v-for="o in options.group"
                  :key="o"
                  @click="
                    formData.group = o;
                    nextStep();
                  "
                  :class="
                    formData.group === o ? 'active-selection' : 'base-selection'
                  "
                  class="selection-card"
                >
                  {{ o }}
                </button>
              </div>
            </div>

            <div v-if="step === 2" class="text-center">
              <h2 class="text-3xl font-serif text-stone-900 mb-12 text-left">
                {{
                  lang === "es" ? "Duración de la estancia" : "Length of stay"
                }}
              </h2>
              <div class="relative py-8">
                <input
                  type="range"
                  min="1"
                  max="7"
                  v-model="formData.days"
                  class="elegant-range"
                />
                <div
                  class="text-[8rem] font-serif leading-none text-stone-200 absolute inset-0 -z-10 flex justify-center items-center opacity-50"
                >
                  {{ formData.days }}
                </div>
              </div>
              <p
                class="text-stone-500 font-medium mb-12 uppercase tracking-widest text-xs"
              >
                {{ formData.days }} {{ lang === "es" ? "Días" : "Days" }}
              </p>
              <button @click="nextStep" class="btn-dark w-full">
                Continuar
              </button>
            </div>

            <div v-if="step === 3">
              <h2 class="text-3xl font-serif text-stone-900 mb-8">
                {{ lang === "es" ? "Tus intereses" : "Interests" }}
              </h2>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="o in options.style"
                  :key="o"
                  @click="toggleSelection('style', o)"
                  :class="
                    formData.style.includes(o) ? 'pill-active' : 'pill-base'
                  "
                  class="pill-card"
                >
                  {{ o }}
                </button>
              </div>
              <button
                @click="nextStep"
                class="btn-dark w-full mt-12"
                :disabled="formData.style.length === 0"
              >
                Siguiente
              </button>
            </div>

            <div v-if="step === 4">
              <h2 class="text-3xl font-serif text-stone-900 mb-8">
                {{ lang === "es" ? "Gastronomía" : "Dining" }}
              </h2>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="o in options.food"
                  :key="o"
                  @click="toggleSelection('food', o)"
                  :class="
                    formData.food.includes(o) ? 'pill-active' : 'pill-base'
                  "
                  class="pill-card"
                >
                  {{ o }}
                </button>
              </div>
              <button
                @click="nextStep"
                class="btn-dark w-full mt-12"
                :disabled="formData.food.length === 0"
              >
                Siguiente
              </button>
            </div>

            <div v-if="step === 5">
              <h2 class="text-3xl font-serif text-stone-900 mb-8">
                {{ lang === "es" ? "Presupuesto" : "Budget" }}
              </h2>
              <div class="grid gap-4">
                <button
                  v-for="o in options.budget"
                  :key="o"
                  @click="
                    formData.budget = o;
                    nextStep();
                  "
                  :class="
                    formData.budget === o
                      ? 'active-selection'
                      : 'base-selection'
                  "
                  class="selection-card"
                >
                  {{ o }}
                </button>
              </div>
            </div>

            <div v-if="step === 6">
              <h2 class="text-3xl font-serif text-stone-900 mb-8">
                {{ lang === "es" ? "Movilidad" : "Transport" }}
              </h2>
              <div class="grid grid-cols-2 gap-4">
                <button
                  v-for="o in options.transport"
                  :key="o"
                  @click="
                    formData.transport = o;
                    fetchOptions();
                  "
                  class="base-selection selection-card text-center text-sm font-bold uppercase tracking-widest"
                >
                  {{ o }}
                </button>
              </div>
            </div>

            <button
              v-if="step > 1"
              @click="prevStep"
              class="text-stone-400 text-xs font-bold uppercase tracking-widest block mx-auto hover:text-stone-800 transition-colors"
            >
              ← Volver
            </button>
          </section>
        </transition>

        <transition name="page" mode="out-in">
          <section v-if="step === 7">
            <div v-if="generating" class="text-center py-32 space-y-6">
              <div class="elegant-loader mx-auto"></div>
              <p class="font-serif italic text-xl text-stone-500 animate-pulse">
                Diseñando su experiencia a medida...
              </p>
            </div>

            <div v-else class="space-y-12">
              <div
                class="bg-stone-900 text-stone-50 p-8 rounded-[2.5rem] shadow-2xl space-y-6 overflow-hidden relative"
              >
                <div class="flex justify-between items-center">
                  <h3 class="font-serif text-2xl tracking-tight">
                    Mi Selección
                  </h3>
                  <span
                    class="bg-stone-700 px-3 py-1 rounded-full text-[10px] font-bold"
                    >{{ myItinerary.length }}</span
                  >
                </div>
                <div class="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                  <div
                    v-for="(item, idx) in myItinerary"
                    :key="idx"
                    class="bg-white/10 px-4 py-2 rounded-xl text-xs flex items-center gap-3 flex-shrink-0 animate-in zoom-in"
                  >
                    {{ item.title }}
                    <button
                      @click="removeFromItinerary(idx)"
                      class="hover:text-rose-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <button
                  v-if="myItinerary.length > 0"
                  @click="goToSummary"
                  class="w-full bg-stone-100 text-stone-900 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
                >
                  Generar Itinerario Final
                </button>
              </div>

              <div class="flex p-1 bg-stone-200/50 rounded-2xl">
                <button
                  v-for="tab in ['activities', 'food', 'transport']"
                  :key="tab"
                  @click="activeTab = tab"
                  :class="
                    activeTab === tab
                      ? 'bg-white shadow-sm text-stone-900'
                      : 'text-stone-500'
                  "
                  class="flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  {{
                    lang === "es"
                      ? tab === "activities"
                        ? "Explorar"
                        : tab === "food"
                        ? "Cenar"
                        : "Moverse"
                      : tab
                  }}
                </button>
              </div>

              <div class="grid gap-6">
                <div
                  v-for="item in recommendations[activeTab]"
                  :key="item.title"
                  class="bg-white/70 backdrop-blur-md border border-white/50 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all"
                >
                  <div
                    v-if="item.is_partner"
                    class="mb-4 text-[10px] font-bold tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full inline-block uppercase"
                  >
                    Partner Hotel
                  </div>

                  <h4 class="text-2xl font-serif text-stone-800 mb-3">
                    {{ item.title }}
                  </h4>
                  <p class="text-stone-500 text-sm leading-relaxed mb-8">
                    {{ item.description }}
                  </p>

                  <div class="flex gap-3">
                    <button
                      @click="addToCalendar(item)"
                      class="flex-1 py-4 bg-stone-100 text-stone-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
                    >
                      Agendar en Calendario
                    </button>

                    <a
                      :href="getGoogleMapsUrl(item.title, hotelData.city)"
                      target="_blank"
                      class="p-4 bg-stone-700 text-white rounded-2xl hover:bg-stone-800 transition-all"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </transition>

        <transition name="page" mode="out-in">
          <section v-if="step === 8" class="text-center space-y-8">
            <h2 class="text-4xl font-serif text-stone-900">
              Su viaje personalizado
            </h2>
            <div
              id="itinerary-pdf-content"
              class="bg-white p-10 rounded-[3rem] shadow-2xl text-left max-w-md mx-auto space-y-8 border border-stone-100"
            >
              <div class="flex justify-center py-4">
                <img
                  :src="qrCodeUrl"
                  class="w-48 h-48 p-2 border border-stone-100 rounded-2xl shadow-inner"
                  alt="Itinerary QR"
                />
              </div>
              <div class="space-y-6">
                <div
                  v-for="(item, idx) in myItinerary"
                  :key="idx"
                  class="space-y-2 group"
                >
                  <div class="flex items-baseline gap-3">
                    <span class="text-[10px] font-bold text-stone-300"
                      >0{{ idx + 1 }}</span
                    >
                    <p class="font-serif text-xl text-stone-800">
                      {{ item.title }}
                    </p>
                  </div>
                  <p class="text-stone-400 text-sm leading-relaxed pl-7">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-4 max-w-xs mx-auto">
              <button @click="shareWhatsApp" class="btn-dark">
                Compartir WhatsApp
              </button>
              <button @click="downloadPDF" class="btn-elegant">
                Descargar PDF
              </button>
            </div>
          </section>
        </transition>
      </main>
    </template>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap");
@import "tailwindcss";

:root {
  --champagne: #fdfcfb;
  --stone: #e2d1c3;
  --dark-stone: #6c3a3a;
  --accent: #c5a059;
}

body {
  font-family: "Plus Jakarta Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.cosy-gradient {
  background: linear-gradient(135deg, var(--champagne) 0%, var(--stone) 100%);
  background-attachment: fixed;
}

/* Botones y UI Elements */
.btn-elegant {
  @apply px-8 py-5 bg-white/60 backdrop-blur-md border border-white rounded-3xl text-sm font-bold uppercase tracking-widest text-stone-700 
         hover:bg-white hover:shadow-xl transition-all duration-300 active:scale-95;
}

.btn-dark {
  @apply px-8 py-5 bg-stone-700 text-white rounded-3xl text-sm font-bold uppercase tracking-widest 
         hover:bg-stone-800 shadow-lg transition-all active:scale-95;
}

.selection-card {
  @apply p-6 text-left rounded-3xl transition-all duration-300 font-medium;
}

.base-selection {
  @apply bg-white/40 border border-white hover:bg-white/80 hover:shadow-lg;
}

.active-selection {
  @apply bg-stone-900 text-white shadow-2xl scale-[1.02];
}

.pill-card {
  @apply px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 border;
}

.pill-base {
  @apply bg-white/40 border-white text-stone-500 hover:bg-white;
}

.pill-active {
  @apply bg-stone-900 border-stone-900 text-white shadow-lg;
}

/* Range Input Moderno */
.elegant-range {
  @apply w-full h-[2px] bg-stone-300 appearance-none cursor-pointer accent-stone-900;
}

/* Loader */
.elegant-loader {
  @apply w-12 h-12 border-[2px] border-stone-200 border-t-stone-800 rounded-full animate-spin;
}

/* Animaciones de Página */
.page-enter-active,
.page-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
