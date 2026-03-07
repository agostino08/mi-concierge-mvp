<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useRecommendationsStore } from '../stores/useRecommendationsStore';
import { useItineraryStore } from '../stores/useItineraryStore';
import { useHotelStore } from '../stores/useHotelStore';
import { useExternalLinks } from '../composables/useExternalLinks';
import { logEvent } from '../services/analytics';

const { t } = useI18n();
const router = useRouter();
const recommendationsStore = useRecommendationsStore();
const itineraryStore = useItineraryStore();
const hotelStore = useHotelStore();
const { addToCalendar, getGoogleMapsUrl } = useExternalLinks();

const recommendations = computed(() => recommendationsStore.recommendations);
const myItinerary = computed(() => itineraryStore.myItinerary);
const generating = computed(() => recommendationsStore.generating);
const hotelData = computed(() => hotelStore.hotelData);

const activeTab = ref('activities');

// Analytics: track itinerary generation completion.
// questionnaire_completed is logged in Step6Transport before navigation.
watch(generating, (isGen, wasGen) => {
  if (!isGen && wasGen) {
    const hotelId = hotelData.value?.id;
    const total = recommendations.value.activities.length + recommendations.value.food.length;
    if (total > 0) logEvent(hotelId, 'itinerary_generated', {
      activities: recommendations.value.activities.length,
      food: recommendations.value.food.length,
    });
  }
});

const isFavorite = (item) => myItinerary.value.some((i) => i.title === item.title);

// Loading screen carousel - facts come from i18n, reactive to language changes
const currentFactIndex = ref(0);
const facts = computed(() => [0, 1, 2, 3, 4].map(i => ({
  title: t(`results.tip${i}_title`),
  text: t(`results.tip${i}_text`),
})));
const loadingImages = [
  'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
  'https://images.pexels.com/photos/2111249/pexels-photo-2111249.jpeg',
  'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg',
  'https://images.pexels.com/photos/1658967/pexels-photo-1658967.jpeg',
];
const currentImgIndex = ref(0);

let timer;
onMounted(() => {
  timer = setInterval(() => {
    currentFactIndex.value = (currentFactIndex.value + 1) % 5;
    currentImgIndex.value = (currentImgIndex.value + 1) % loadingImages.length;
  }, 6500);
});
onUnmounted(() => clearInterval(timer));

const heroImage = computed(() =>
  hotelData.value?.cover_url || 'https://images.pexels.com/photos/1458457/pexels-photo-1458457.jpeg'
);

async function handlePrepareSummary() {
  const ready = await itineraryStore.prepareSummary();
  if (ready) router.push('/summary');
}

function handleReset() {
  const hotelId = itineraryStore.resetApp();
  router.push({ path: '/welcome', query: { hotel: hotelId } });
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4">
    <!-- Loading / generating screen -->
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
            alt=""
            class="absolute inset-0 w-full h-full object-cover brightness-[0.4] scale-110 transition-all duration-[2000ms]"
          />
        </transition-group>
      </div>

      <div class="relative z-10 text-center max-w-md w-full space-y-12">
        <div class="relative mx-auto w-24 h-24">
          <div class="absolute inset-0 border-t-2 border-white/20 rounded-full"></div>
          <div class="absolute inset-0 border-t-2 border-amber-400 rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-white/40 text-[10px] uppercase tracking-tighter animate-pulse font-bold">AI</span>
          </div>
        </div>

        <div class="space-y-4 min-h-[120px] flex flex-col justify-center">
          <transition name="slide-up" mode="out-in">
            <div :key="currentFactIndex" class="space-y-2">
              <p class="text-amber-400 text-[10px] font-bold uppercase tracking-[0.4em]">
                {{ facts[currentFactIndex].title }}
              </p>
              <h4 class="text-white font-serif text-2xl italic px-4 leading-snug">
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

    <!-- Results -->
    <div v-else class="space-y-8 animate-in fade-in duration-700 py-6">
      <div class="relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
        <img :src="heroImage" alt="" class="absolute inset-0 w-full h-full object-cover" />
        <div class="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center p-6">
          <span class="text-white/80 text-xs uppercase tracking-[0.4em] mb-2">
            {{ $t('results.discover') }}
          </span>
          <h2 class="text-white text-4xl font-serif italic">{{ hotelData?.city }}</h2>
        </div>
      </div>

      <div class="bg-stone-900 text-stone-50 p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-white/10">
        <div class="text-center md:text-left">
          <h4 class="text-xl font-serif">{{ $t('results.generating') }}</h4>
          <p class="text-stone-400 text-sm">{{ $t('results.wait_msg') }}</p>
          <p class="text-stone-500 text-[10px] uppercase tracking-widest mt-1">
            {{ myItinerary.length }} {{ $t('results.saved_places') }}
          </p>
        </div>
        <button
          v-if="myItinerary.length > 0"
          @click="handlePrepareSummary()"
          class="bg-white text-stone-900 px-8 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-stone-200 transition-all active:scale-95 shadow-lg whitespace-nowrap"
        >
          {{ $t('results.view_summary') }}
        </button>
      </div>

      <!-- Tab bar -->
      <div class="flex p-1.5 bg-stone-200/50 rounded-2xl sticky top-4 z-20 backdrop-blur-md border border-white">
        <button
          v-for="tab in ['activities', 'food', 'transport']"
          :key="tab"
          @click="activeTab = tab"
          :class="activeTab === tab ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'"
          class="flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
        >
          {{ tab === 'activities' ? $t('results.tabs.activities') : tab === 'food' ? $t('results.tabs.food') : $t('results.tabs.transport') }}
        </button>
      </div>

      <!-- Empty state while streaming -->
      <div
        v-if="recommendations[activeTab].length === 0"
        class="flex flex-col items-center justify-center py-24 text-center gap-4"
      >
        <div class="w-12 h-12 border-2 border-stone-200 border-t-amber-400 rounded-full animate-spin"></div>
        <p class="text-stone-400 text-base tracking-wide">{{ $t('results.generating') }}</p>
      </div>

      <!-- Cards -->
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
            <span class="text-[8px] font-black uppercase tracking-tighter">{{ $t('results.local_suggestion') }}</span>
          </div>

          <button
            v-if="activeTab !== 'transport'"
            @click="itineraryStore.toggleFavorite(item)"
            class="absolute top-8 right-8 p-3 rounded-full transition-all duration-300 z-10"
            :class="isFavorite(item) ? 'bg-rose-50 text-rose-500' : 'bg-stone-50 text-stone-300 hover:text-rose-300'"
            :aria-label="$t('results.add_favorite')"
          >
            <svg class="w-6 h-6" :fill="isFavorite(item) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          <div class="max-w-[85%] mt-2">
            <h4 class="text-2xl font-serif text-stone-800 mb-3 leading-tight">{{ item.title }}</h4>
            <p class="text-stone-500 text-base leading-relaxed mb-8">{{ item.description }}</p>
          </div>

          <div v-if="activeTab !== 'transport'" class="flex gap-4">
            <button
              @click="addToCalendar(item)"
              class="flex-1 py-4 bg-stone-50 text-stone-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-100 transition-all flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ $t('results.add_to_calendar') }}
            </button>
            <a
              :href="getGoogleMapsUrl(item.title)"
              target="_blank"
              rel="noopener noreferrer"
              class="px-6 py-4 bg-stone-800 text-white rounded-2xl hover:bg-black transition-all shadow-lg flex items-center justify-center"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div class="pt-12 pb-8 text-center border-t border-stone-100">
        <button
          @click="handleReset()"
          class="text-stone-400 hover:text-stone-800 text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 mx-auto"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ $t('results.reset') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.6s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(20px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-20px); }
</style>
