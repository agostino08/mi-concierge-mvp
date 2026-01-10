<script setup>
import { ref, onMounted } from "vue";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min.js";

// === ESTADOS ===
const loading = ref(true);
const generating = ref(false);
const hotelData = ref(null);
const itinerary = ref(null);
const error = ref(null);

// FORMULARIO
const formData = ref({
  people: '2',
  days: 3,
  group: 'Pareja',
  style: [], // Ahora es un array para selección múltiple
  food: [],  // Ahora es un array para selección múltiple
  transport: 'Transporte público'
});

// Añade esta función para manejar los clics
const toggleOption = (field, value) => {
  const index = formData.value[field].indexOf(value);
  if (index > -1) {
    formData.value[field].splice(index, 1); // Si ya está, lo quita
  } else {
    formData.value[field].push(value); // Si no está, lo añade
  }
};

const options = {
  people: ["1", "2", "3", "4", "5", "+5"],
  group: ["Solo", "Pareja", "Familia", "Amigos", "Negocios"],
  style: [
    "Vida nocturna",
    "Naturaleza",
    "Historia",
    "Arte",
    "Deportes",
    "Relax",
  ],
  food: ["Local", "Fusión", "Veggie", "Sea food", "Fast Food"],
  transport: ["Público", "Coche", "Bicicleta", "A pie"],
};

const loadingStep = ref(0);
const loadingPhrases = [
  "Consultando con nuestro experto local...",
  "Buscando los mejores rincones de la ciudad...",
  "Evitando las trampas para turistas...",
  "Casi listo, tu itinerario está quedando genial...",
];

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const hotelId = params.get("hotel");
  if (!hotelId) {
    error.value =
      "Por favor, accede con un ID de hotel (ej: ?hotel=hotel_demo)";
    loading.value = false;
    return;
  }
  try {
    const docSnap = await getDoc(doc(db, "hotels", hotelId));
    if (docSnap.exists()) {
      hotelData.value = docSnap.data();
    } else {
      error.value = "Hotel no encontrado en Firebase";
    }
  } catch (e) {
    error.value = "Error de conexión";
  } finally {
    loading.value = false;
  }
});

const createItinerary = async () => {
  generating.value = true;
  let timer = setInterval(() => {
    loadingStep.value = (loadingStep.value + 1) % loadingPhrases.length;
  }, 3000);

  try {
    const response = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotel: hotelData.value, user: formData.value }),
    });
    const data = await response.json();
    itinerary.value = data.itinerary;
  } catch (e) {
    alert("Error al generar el itinerario");
  } finally {
    clearInterval(timer);
    generating.value = false;
  }
};

const openMap = (coords) => {
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${coords}`,
    "_blank"
  );
};

const shareWhatsApp = () => {
  const text = `¡Mira mi itinerario en ${hotelData.value.name}! 🌍`;
  window.open(
    `https://wa.me/?text=${encodeURIComponent(
      text + " " + window.location.href
    )}`
  );
};

const downloadPDF = () => {
  const element = document.getElementById("itinerary-content");
  const opt = {
    margin: 1,
    filename: "itinerario.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };
  html2pdf().set(opt).from(element).save();
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans text-gray-900 pb-10">
    <header
      v-if="hotelData"
      class="bg-white shadow-sm border-b sticky top-0 z-50 p-4 flex justify-between items-center"
    >
      <img :src="hotelData.logo_url" class="h-10 object-contain" alt="logo" />
      <div class="text-right">
        <p class="text-xs font-bold uppercase tracking-widest text-gray-400">
          {{ hotelData.city }}
        </p>
      </div>
    </header>

    <main class="max-w-md mx-auto p-4">
      <div
        v-if="error"
        class="bg-red-100 text-red-700 p-4 rounded-xl mt-10 text-center"
      >
        {{ error }}
      </div>

      <section
        v-else-if="!itinerary && !generating"
        class="animate-in fade-in duration-500"
      >
        <h1 class="text-3xl font-black mb-2 mt-6">Hola.</h1>
        <p class="text-gray-500 mb-8">Personaliza tu estancia en la ciudad.</p>

        <div class="space-y-6">
          <div>
            <label
              class="text-xs font-black text-gray-400 uppercase tracking-tighter"
              >¿Con quién viajas?</label
            >
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                v-for="opt in options.group"
                :key="opt"
                @click="formData.group = opt"
                :class="
                  formData.group === opt
                    ? 'bg-black text-white shadow-lg'
                    : 'bg-white border text-gray-600'
                "
                class="px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95"
              >
                {{ opt }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-black text-gray-400 uppercase"
                >Días</label
              >
              <select
                v-model="formData.days"
                class="w-full mt-2 p-3 bg-white border rounded-2xl font-bold"
              >
                <option v-for="n in 7" :key="n" :value="n">
                  {{ n }} día{{ n > 1 ? "s" : "" }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs font-black text-gray-400 uppercase tracking-tighter">¿Qué te apetece? (Elige varios)</label>
              <div class="flex flex-wrap gap-2 mt-2">
                <button v-for="opt in options.style" :key="opt" @click="toggleOption('style', opt)"
                  :class="formData.style.includes(opt) ? 'bg-black text-white shadow-lg' : 'bg-white border text-gray-600'"
                  class="px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95">
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-black text-gray-400 uppercase">Comida (Elige varias)</label>
            <div class="flex flex-wrap gap-2 mt-2">
              <button v-for="opt in options.food" :key="opt" @click="toggleOption('food', opt)"
                :class="formData.food.includes(opt) ? 'bg-black text-white shadow-lg' : 'bg-white border text-gray-600'"
                class="px-5 py-2.5 rounded-full text-sm font-bold">
                {{ opt }}
              </button>
            </div>
          </div>

        <button
          @click="createItinerary"
          class="w-full bg-black text-white py-5 rounded-2xl font-black mt-10 shadow-xl active:scale-95 transition-transform uppercase tracking-widest"
        >
          Crear mi Plan
        </button>
      </section>

      <section
        v-else-if="generating"
        class="flex flex-col items-center justify-center pt-24 text-center"
      >
        <div
          class="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="mt-10 text-2xl font-black leading-tight">
          {{ loadingPhrases[loadingStep] }}
        </p>
        <p class="text-gray-400 mt-2">Diseñando una experiencia única...</p>
      </section>

      <section
        v-else-if="itinerary"
        class="animate-in slide-in-from-bottom duration-700"
      >
        <div class="flex justify-between items-center mb-8">
          <button
            @click="itinerary = null"
            class="text-xs font-black uppercase tracking-widest text-gray-400"
          >
            ← Volver
          </button>
          <div class="flex gap-2">
            <button
              @click="shareWhatsApp"
              class="bg-green-500 text-white p-3 rounded-xl shadow-md"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                />
              </svg>
            </button>
            <button
              @click="downloadPDF"
              class="bg-black text-white p-3 rounded-xl shadow-md text-xs font-bold uppercase"
            >
              PDF
            </button>
          </div>
        </div>

        <div id="itinerary-content">
          <div v-for="day in itinerary" :key="day.day" class="mb-12">
            <h2
              class="text-xs font-black text-gray-400 tracking-[0.2em] uppercase mb-6 flex items-center"
            >
              <span class="w-8 h-px bg-gray-300 mr-3"></span> Día
              {{ day.day }} • {{ day.title }}
            </h2>

            <div class="space-y-6">
              <div
                v-for="act in day.activities"
                :key="act.title"
                class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group"
              >
                <div
                  v-if="act.is_partner"
                  class="absolute top-0 right-0 bg-yellow-400 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-tighter"
                >
                  ⭐ Favorito del Hotel
                </div>

                <span class="text-xs font-black text-blue-600 block mb-2">{{
                  act.time
                }}</span>
                <h3 class="font-black text-xl mb-3 leading-tight">
                  {{ act.title }}
                </h3>
                <p class="text-gray-500 text-sm leading-relaxed mb-6">
                  {{ act.description }}
                </p>

                <div
                  class="flex justify-between items-center border-t border-gray-50 pt-5"
                >
                  <span
                    class="text-[10px] font-bold text-gray-300 uppercase tracking-widest"
                    >{{ act.distance_from_hotel_km || "Cerca" }} KM DE TI</span
                  >
                  <button
                    @click="openMap(act.coordinates)"
                    class="text-xs font-black underline underline-offset-4 hover:text-blue-600 transition-colors"
                  >
                    VER MAPA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
/* Animaciones básicas */
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-in {
  animation: fadeIn 0.5s ease-out forwards;
}
</style>
