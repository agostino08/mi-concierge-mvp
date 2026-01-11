<script setup>
import { ref, computed, onMounted } from "vue";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import QRCode from "qrcode"; // Necesitarás instalar 'qrcode'
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min.js";

// === ESTADOS DE NAVEGACIÓN ===
const step = ref(0); // 0: Idioma, 1: Grupo, 2: Días, 3: Estilos, 4: Comida, 5: Presupuesto, 6: Transporte, 7: Recomendaciones, 8: Resumen
const lang = ref("es");
const loading = ref(true);
const generating = ref(false);
const hotelData = ref(null);
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

// === LÓGICA DE PASOS ===
const nextStep = () => step.value++;
const prevStep = () => step.value--;

const toggleSelection = (field, value) => {
  const arr = formData.value[field];
  const index = arr.indexOf(value);
  if (index > -1) arr.splice(index, 1);
  else arr.push(value);
};

// === GENERAR RECOMENDACIONES (MODO BUILDER) ===
const fetchOptions = async () => {
  generating.value = true;
  nextStep(); // Va a la pantalla de recomendaciones (step 7)

  try {
    const response = await fetch("/api/generate-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotel: hotelData.value,
        user: formData.value,
        lang: lang.value,
      }),
    });
    const data = await response.json();
    recommendations.value = data;
  } catch (e) {
    console.error("Error obteniendo opciones", e);
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

const getGoogleMapsUrl = (title, city) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    title + " " + city
  )}`;
};

const generateQR = async () => {
  // Aquí puedes construir una URL para compartir tu itinerario
  // Por ahora, compartiremos la URL actual con un flag de itinerario
  const itineraryData = JSON.stringify(myItinerary.value);
  const shareUrl = `${window.location.origin}${
    window.location.pathname
  }?hotel=${hotelData.value.id}&itinerary=${btoa(itineraryData)}`;
  qrCodeUrl.value = await QRCode.toDataURL(shareUrl);
};

const shareWhatsApp = () => {
  const text = `¡Mira el itinerario que he creado para mi estancia en ${hotelData.value.name}! ✨`;
  window.open(
    `https://wa.me/?text=${encodeURIComponent(
      text + " " + window.location.href
    )}`
  ); // TODO: Cambiar por la URL del itinerario generado
};

const downloadPDF = () => {
  const element = document.getElementById("itinerary-pdf-content");
  const opt = {
    margin: 1,
    filename: "mi-itinerario-personalizado.pdf",
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
    alert("Por favor, añade al menos una actividad a tu itinerario.");
  }
};

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const hotelId = params.get("hotel");
  if (!hotelId) {
    // Si no hay hotelId, podrías redirigir o mostrar un mensaje de error
    error.value =
      "Por favor, accede con un ID de hotel (ej: ?hotel=hotel_demo)";
    loading.value = false;
    return;
  }

  // Asignar el ID del hotel para usarlo en el QR y otras funciones
  formData.value.hotelId = hotelId;

  try {
    const docSnap = await getDoc(doc(db, "hotels", hotelId));
    if (docSnap.exists()) {
      hotelData.value = { id: hotelId, ...docSnap.data() }; // Guarda también el ID
    } else {
      error.value = "Hotel no encontrado en Firebase";
    }
  } catch (e) {
    error.value = "Error de conexión con Firebase";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#faf9f6] text-[#1a1a1a] font-light">
    <header v-if="hotelData" class="p-6 flex justify-between items-center">
      <img
        :src="hotelData.logo_url"
        class="h-8 grayscale hover:grayscale-0 transition-all"
        alt="Hotel Logo"
      />
      <div
        v-if="step > 0 && step < 7"
        class="h-1 w-24 bg-gray-200 rounded-full overflow-hidden"
      >
        <div
          class="h-full bg-black transition-all duration-500"
          :style="{ width: (step / 6) * 100 + '%' }"
        ></div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-6 py-12">
      <transition name="fade" mode="out-in">
        <section
          v-if="step === 0"
          class="flex flex-col items-center text-center space-y-8 animate-fade-in"
        >
          <h1 class="text-5xl font-serif italic">
            {{ lang === "es" ? "Bienvenido" : "Welcome" }}
          </h1>
          <p class="text-gray-400">
            {{
              lang === "es"
                ? "Seleccione su idioma preferido"
                : "Select your preferred language"
            }}
          </p>
          <div class="flex gap-4">
            <button
              @click="
                lang = 'es';
                nextStep();
              "
              class="btn-primary"
            >
              Español
            </button>
            <button
              @click="
                lang = 'en';
                nextStep();
              "
              class="btn-primary"
            >
              English
            </button>
          </div>
        </section>
      </transition>

      <transition name="slide-up" mode="out-in">
        <section v-if="step >= 1 && step <= 6" class="space-y-10">
          <div v-if="step === 1">
            <h2 class="text-4xl font-serif mb-8 italic">
              {{
                lang === "es"
                  ? "¿Con quién viajas?"
                  : "Who are you travelling with?"
              }}
            </h2>
            <div class="grid grid-cols-1 gap-3">
              <button
                v-for="o in options.group"
                :key="o"
                @click="
                  formData.group = o;
                  nextStep();
                "
                :class="
                  formData.group === o
                    ? 'bg-black text-white'
                    : 'bg-white border'
                "
                class="selection-card"
              >
                {{ o }}
              </button>
            </div>
          </div>

          <div v-if="step === 2">
            <h2 class="text-4xl font-serif mb-8 italic">
              {{
                lang === "es"
                  ? "¿Cuántos días estarás con nosotros?"
                  : "How many days will you be staying?"
              }}
            </h2>
            <input
              type="range"
              min="1"
              max="7"
              v-model="formData.days"
              class="w-full accent-black"
            />
            <p class="text-center text-6xl font-serif mt-4">
              {{ formData.days }}
            </p>
            <button @click="nextStep" class="w-full btn-black mt-8">
              {{ lang === "es" ? "Continuar" : "Continue" }}
            </button>
          </div>

          <div v-if="step === 3">
            <h2 class="text-4xl font-serif mb-8 italic">
              {{
                lang === "es"
                  ? "¿Qué te apetece explorar?"
                  : "What do you feel like exploring?"
              }}
            </h2>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="o in options.style"
                :key="o"
                @click="toggleSelection('style', o)"
                :class="
                  formData.style.includes(o)
                    ? 'bg-black text-white'
                    : 'bg-white border'
                "
                class="pill-card"
              >
                {{ lang === "es" ? o : o }}
              </button>
            </div>
            <button
              @click="nextStep"
              class="w-full btn-black mt-8"
              :disabled="formData.style.length === 0"
            >
              {{ lang === "es" ? "Siguiente" : "Next" }}
            </button>
          </div>

          <div v-if="step === 4">
            <h2 class="text-4xl font-serif mb-8 italic">
              {{
                lang === "es"
                  ? "¿Cuál es tu comida favorita?"
                  : "What's your favorite food?"
              }}
            </h2>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="o in options.food"
                :key="o"
                @click="toggleSelection('food', o)"
                :class="
                  formData.food.includes(o)
                    ? 'bg-black text-white'
                    : 'bg-white border'
                "
                class="pill-card"
              >
                {{ lang === "es" ? o : o }}
              </button>
            </div>
            <button
              @click="nextStep"
              class="w-full btn-black mt-8"
              :disabled="formData.food.length === 0"
            >
              {{ lang === "es" ? "Siguiente" : "Next" }}
            </button>
          </div>

          <div v-if="step === 5">
            <h2 class="text-4xl font-serif mb-8 italic">
              {{
                lang === "es"
                  ? "¿Cuál es tu presupuesto?"
                  : "What is your budget?"
              }}
            </h2>
            <div class="grid grid-cols-1 gap-3">
              <button
                v-for="o in options.budget"
                :key="o"
                @click="
                  formData.budget = o;
                  nextStep();
                "
                :class="
                  formData.budget === o
                    ? 'bg-black text-white'
                    : 'bg-white border'
                "
                class="selection-card"
              >
                {{ lang === "es" ? o : o }}
              </button>
            </div>
          </div>

          <div v-if="step === 6">
            <h2 class="text-4xl font-serif mb-8 italic">
              {{
                lang === "es"
                  ? "¿Cómo prefieres moverte?"
                  : "How do you prefer to get around?"
              }}
            </h2>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="o in options.transport"
                :key="o"
                @click="
                  formData.transport = o;
                  fetchOptions();
                "
                class="selection-card border"
              >
                {{ lang === "es" ? o : o }}
              </button>
            </div>
          </div>

          <button
            v-if="step > 1"
            @click="prevStep"
            class="text-gray-400 text-sm underline block mx-auto mt-10"
          >
            {{ lang === "es" ? "Volver" : "Back" }}
          </button>
        </section>
      </transition>

      <transition name="fade" mode="out-in">
        <section v-if="step === 7">
          <div v-if="generating" class="text-center py-20 animate-fade-in">
            <div class="loader mx-auto"></div>
            <p class="mt-8 font-serif italic text-xl">
              {{
                lang === "es"
                  ? "Curando las mejores opciones para ti..."
                  : "Curating the best options for you..."
              }}
            </p>
          </div>

          <div v-else class="space-y-8 animate-fade-in">
            <div class="bg-black text-white p-6 rounded-3xl shadow-2xl mb-10">
              <h3 class="text-lg font-serif italic mb-4">
                {{ lang === "es" ? "Mi Selección" : "My Selection" }} ({{
                  myItinerary.length
                }})
              </h3>
              <div class="flex gap-2 overflow-x-auto pb-2">
                <div
                  v-for="(item, idx) in myItinerary"
                  :key="idx"
                  class="bg-white/10 px-4 py-2 rounded-full text-xs flex items-center gap-2 flex-shrink-0"
                >
                  {{ item.title }}
                  <button
                    @click="removeFromItinerary(idx)"
                    class="ml-2 font-bold text-white/70 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p
                  v-if="myItinerary.length === 0"
                  class="text-gray-500 text-sm italic"
                >
                  {{
                    lang === "es"
                      ? "Aún no has añadido nada..."
                      : "Nothing added yet..."
                  }}
                </p>
              </div>
              <button
                v-if="myItinerary.length > 0"
                @click="goToSummary"
                class="mt-4 w-full bg-white text-black py-3 rounded-xl font-bold text-sm"
              >
                {{
                  lang === "es"
                    ? "FINALIZAR Y VER RESUMEN"
                    : "FINALIZE AND SEE SUMMARY"
                }}
              </button>
            </div>

            <div class="flex border-b mb-6">
              <button
                v-for="tab in ['activities', 'food', 'transport']"
                :key="tab"
                @click="activeTab = tab"
                :class="
                  activeTab === tab
                    ? 'border-b-2 border-black font-bold'
                    : 'text-gray-400'
                "
                class="flex-1 py-4 capitalize transition-all"
              >
                {{
                  lang === "es"
                    ? tab === "activities"
                      ? "Actividades"
                      : tab === "food"
                      ? "Comida"
                      : "Transporte"
                    : tab
                }}
              </button>
            </div>

            <div class="grid gap-6">
              <div
                v-for="item in recommendations[activeTab]"
                :key="item.title"
                class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h4 class="text-xl font-bold mb-2">{{ item.title }}</h4>
                  <p class="text-gray-500 text-sm leading-relaxed mb-4">
                    {{ item.description }}
                  </p>
                </div>
                <div
                  class="flex justify-between items-center mt-4 pt-4 border-t border-gray-50"
                >
                  <a
                    :href="getGoogleMapsUrl(item.title, hotelData.city)"
                    target="_blank"
                    class="text-xs underline font-bold tracking-widest"
                    >{{ lang === "es" ? "VER EN MAPA" : "VIEW ON MAP" }}</a
                  >
                  <button
                    @click="addToItinerary(item)"
                    class="bg-gray-100 p-3 rounded-full hover:bg-black hover:text-white transition-colors"
                  >
                    <span class="text-xl">+</span>
                  </button>
                </div>
              </div>
            </div>
            <button
              @click="prevStep"
              class="text-gray-400 text-sm underline block mx-auto mt-10"
            >
              {{ lang === "es" ? "Volver" : "Back" }}
            </button>
          </div>
        </section>
      </transition>

      <transition name="fade" mode="out-in">
        <section v-if="step === 8" class="text-center animate-fade-in">
          <h2 class="text-4xl font-serif italic mb-6">
            {{
              lang === "es"
                ? "Tu itinerario está listo!"
                : "Your itinerary is ready!"
            }}
          </h2>
          <p class="text-gray-500 mb-10">
            {{
              lang === "es"
                ? "Escanea el QR o comparte tu plan:"
                : "Scan the QR or share your plan:"
            }}
          </p>

          <div
            class="bg-white p-8 rounded-3xl shadow-xl inline-block mb-10"
            id="itinerary-pdf-content"
          >
            <h3 class="text-2xl font-bold mb-4">
              {{
                lang === "es"
                  ? "Mi Itinerario Personalizado"
                  : "My Custom Itinerary"
              }}
            </h3>
            <img
              :src="qrCodeUrl"
              alt="Código QR de tu itinerario"
              class="w-48 h-48 mx-auto border border-gray-100 p-2 mb-6"
            />

            <div class="text-left space-y-4">
              <div
                v-for="(item, idx) in myItinerary"
                :key="idx"
                class="flex items-center gap-3"
              >
                <span
                  class="bg-gray-100 text-xs font-bold px-3 py-1 rounded-full flex-shrink-0"
                  >{{ idx + 1 }}</span
                >
                <div>
                  <p class="font-bold">{{ item.title }}</p>
                  <p class="text-gray-500 text-xs">
                    {{ item.description.substring(0, 50) + "..." }}
                  </p>
                </div>
              </div>
            </div>
            <p
              v-if="myItinerary.length === 0"
              class="text-gray-500 italic mt-4"
            >
              {{
                lang === "es"
                  ? "No hay ítems en tu itinerario."
                  : "No items in your itinerary."
              }}
            </p>
          </div>

          <div class="flex gap-4 justify-center">
            <button
              @click="shareWhatsApp"
              class="btn-primary flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                />
              </svg>
              {{ lang === "es" ? "WhatsApp" : "WhatsApp" }}
            </button>
            <button
              @click="downloadPDF"
              class="btn-primary flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"
                />
              </svg>
              {{ lang === "es" ? "Descargar PDF" : "Download PDF" }}
            </button>
          </div>
          <button
            @click="
              step = 0;
              myItinerary = [];
            "
            class="text-gray-400 text-sm underline block mx-auto mt-10"
          >
            {{ lang === "es" ? "Crear Nuevo Plan" : "Create New Plan" }}
          </button>
        </section>
      </transition>
    </main>
  </div>
</template>

<style>
/* FUENTE (Importar en index.css o aquí si es scoped) */
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap");

/* ESTILOS GLOBALES BASE (desde index.css) */
@import "tailwindcss";

/* CLASES PERSONALIZADAS */
.font-serif {
  font-family: "Playfair Display", serif;
}

.btn-primary {
  @apply px-8 py-4 bg-white border border-gray-200 rounded-full hover:border-black transition-all font-medium text-sm;
}
.btn-black {
  @apply px-8 py-5 bg-black text-white rounded-2xl hover:scale-[1.02] transition-all font-bold text-sm;
}
.selection-card {
  @apply p-6 text-left rounded-3xl text-lg font-medium transition-all hover:shadow-md;
}
.pill-card {
  @apply px-6 py-3 rounded-full text-sm font-medium transition-all border;
}

/* ANIMACIONES */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1),
    opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1a1a1a;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
