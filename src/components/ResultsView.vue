<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useItineraryStore } from "../stores/useItineraryStore";
import { useHotelStore } from "../stores/useHotelStore";

const itineraryStore = useItineraryStore();
const hotelStore = useHotelStore();

const recommendations = computed(() => itineraryStore.recommendations);
const myItinerary = computed(() => itineraryStore.myItinerary);
const generating = computed(() => itineraryStore.generating);
const hotelData = computed(() => hotelStore.hotelData);

const activeTab = ref("activities");

const isFavorite = (item) =>
  myItinerary.value.some((i) => i.title === item.title);

// --- LÓGICA DE LA PANTALLA DE ESPERA ---
const currentFactIndex = ref(0);
const facts = [
  {
    title: "Tradition",
    text: "Barcelona has 9 UNESCO World Heritage sites.",
  },
  {
    title: "Gastronomy",
    text: "Peak dinner time in the city usually starts around 9:00 PM.",
  },
  {
    title: "Curiosity",
    text: "Park Güell was originally designed as a luxury housing estate, not a park.",
  },
  {
    title: "Transport",
    text: "The city's metro network is one of the most accessible and fastest in Europe.",
  },
  {
    title: "Culture",
    text: "Sant Jordi (April 23) is the most romantic day: the city is filled with books and roses.",
  },
];

const loadingImages = [
  "https://images.pexels.com/photos/16041820/pexels-photo-16041820.jpeg",
  "https://images.pexels.com/photos/17356918/pexels-photo-17356918.jpeg",
  "https://images.pexels.com/photos/34459139/pexels-photo-34459139.jpeg",
  "https://images.pexels.com/photos/8738207/pexels-photo-8738207.jpeg",
];
const currentImgIndex = ref(0);

let timer;
onMounted(() => {
  timer = setInterval(() => {
    currentFactIndex.value = (currentFactIndex.value + 1) % facts.length;
    currentImgIndex.value = (currentImgIndex.value + 1) % loadingImages.length;
  }, 6500);
});

onUnmounted(() => clearInterval(timer));
// --- FIN LÓGICA ESPERA ---

// Imagen Hero Principal para los resultados
const heroImage = `https://images.pexels.com/photos/14570751/pexels-photo-14570751.jpeg`;

const addToCalendar = (item) => {
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.description);
  window.open(
    `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`,
    "_blank"
  );
};

const getGoogleMapsUrl = (title) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    title + " " + hotelData.value?.city
  )}`;
</script>

<template>
  <div class="max-w-4xl mx-auto px-4">
    <div
      v-if="generating"
      class="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      <div class="absolute inset-0 z-0">
        <transition-group name="fade">
          <img
            v-for="(img, idx) in loadingImages"
            :key="img"
            v-show="currentImgIndex === idx"
            :src="img"
            class="absolute inset-0 w-full h-full object-cover brightness-[0.4] scale-110 transition-all duration-[2000ms]"
          />
        </transition-group>
      </div>

      <div class="relative z-10 text-center max-w-md w-full space-y-12">
        <div class="relative mx-auto w-24 h-24">
          <div
            class="absolute inset-0 border-t-2 border-white/20 rounded-full"
          ></div>
          <div
            class="absolute inset-0 border-t-2 border-amber-400 rounded-full animate-spin"
          ></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span
              class="text-white/40 text-[10px] uppercase tracking-tighter animate-pulse font-bold"
              >AI</span
            >
          </div>
        </div>

        <div class="space-y-4 min-h-[120px] flex flex-col justify-center">
          <transition name="slide-up" mode="out-in">
            <div :key="currentFactIndex" class="space-y-2">
              <p
                class="text-amber-400 text-[10px] font-bold uppercase tracking-[0.4em]"
              >
                {{ $t('results.reset') }}
              </p>
              <h4
                class="text-white font-serif text-2xl italic px-4 leading-snug"
              >
                {{ facts[currentFactIndex].text }}
              </h4>
            </div>
          </transition>
        </div>

        <div class="pt-10">
          <p class="text-white/40 text-[10px] uppercase tracking-[0.2em]">
            {{ $t('results.customizing', { city: hotelData?.city }) }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="space-y-8 animate-in fade-in duration-700 py-6">
      <div
        class="relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12"
      >
        <img
          :src="heroImage"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div
          class="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center p-6"
        >
          <span
            class="text-white/80 text-[10px] uppercase tracking-[0.4em] mb-2"
            >{{ $t('results.discover') }}</span
          >
          <h2 class="text-white text-4xl font-serif italic">
            {{ hotelData?.city }}
          </h2>
        </div>
      </div>

      <div
        class="bg-stone-900 text-stone-50 p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-white/10"
      >
        <div class="text-center md:text-left">
          <h4 class="text-xl font-serif text-stone-800">{{ $t('results.generating') }}</h4>
          <p class="text-stone-500 text-sm">{{ $t('results.wait_msg') }}</p>
          <p class="text-stone-400 text-[10px] uppercase tracking-widest">
            {{ myItinerary.length }} {{ $t('results.saved_places') }}
          </p>
        </div>
        <button
          v-if="myItinerary.length > 0"
          @click="itineraryStore.prepareSummary()"
          class="bg-white text-stone-900 px-8 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-stone-200 transition-all active:scale-95 shadow-lg"
        >
          {{ $t('results.view_summary') }}
        </button>
      </div>

      <div
        class="flex p-1.5 bg-stone-200/50 rounded-2xl sticky top-4 z-20 backdrop-blur-md border border-white"
      >
        <button
          v-for="tab in ['activities', 'food', 'transport']"
          :key="tab"
          @click="activeTab = tab"
          :class="
            activeTab === tab
              ? 'bg-white shadow-sm text-stone-900'
              : 'text-stone-500'
          "
          class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
        >
          {{
            tab === "activities"
              ? $t('results.tabs.activities')
              : tab === "food"
              ? $t('results.tabs.food')
              : $t('results.tabs.transport')
          }}
        </button>
      </div>

      <div class="grid gap-6">
        <div
          v-for="item in recommendations[activeTab]"
          :key="item.title"
          class="relative bg-white border border-stone-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden"
        >
          <div
            v-if="item.is_partner"
            class="absolute -top-1 -left-1 bg-amber-400 text-amber-900 px-4 py-1.5 rounded-br-2xl shadow-sm z-10 border-b border-r border-white"
          >
            <span class="text-[8px] font-black uppercase tracking-tighter"
              >{{ $t('results.local_suggestion') }}</span
            >
          </div>

          <button
            v-if="activeTab !== 'transport'"
            @click="itineraryStore.toggleFavorite(item)"
            class="absolute top-8 right-8 p-3 rounded-full transition-all duration-300 z-10"
            :class="
              isFavorite(item)
                ? 'bg-rose-50 text-rose-500'
                : 'bg-stone-50 text-stone-300 hover:text-rose-300'
            "
          >
            <svg
              class="w-6 h-6"
              :fill="isFavorite(item) ? 'currentColor' : 'none'"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          <div class="max-w-[85%] mt-2">
            <h4 class="text-2xl font-serif text-stone-800 mb-3 leading-tight">
              {{ item.title }}
            </h4>
            <p class="text-stone-500 text-sm leading-relaxed mb-8">
              {{ item.description }}
            </p>
          </div>

          <div v-if="activeTab !== 'transport'" class="flex gap-4">
            <button
              @click="addToCalendar(item)"
              class="flex-1 py-4 bg-stone-50 text-stone-600 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-100 transition-all flex items-center justify-center gap-2"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {{ $t('results.add_to_calendar') }}
            </button>
            <a
              :href="getGoogleMapsUrl(item.title)"
              target="_blank"
              class="px-6 py-4 bg-stone-800 text-white rounded-2xl hover:bg-black transition-all shadow-lg flex items-center justify-center"
            >
              <svg
                class="w-4 h-4"
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

      <div class="pt-12 pb-8 text-center border-t border-stone-100">
        <button
          @click="itineraryStore.resetApp()"
          class="text-stone-400 hover:text-stone-800 text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 mx-auto"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {{ $t('results.reset') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Transición de Imágenes de Fondo (Wait screen) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transición de Textos (Wait screen) */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.6s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
