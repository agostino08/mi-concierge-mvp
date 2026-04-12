<script setup>
import { onMounted, watch, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import HotelChatbot from './components/HotelChatbot.vue';
import { useUIStore } from './stores/useUIStore';
import { useItineraryStore } from './stores/useItineraryStore';
import { useAppInit } from './composables/useAppInit';

// ─── Cookie consent ────────────────────────────────────────────────────────────
const showCookieBanner = ref(false);
onMounted(() => {
  if (!localStorage.getItem('mc_cookies')) showCookieBanner.value = true;
});
function acceptCookies()  { localStorage.setItem('mc_cookies', 'accepted');  showCookieBanner.value = false; }
function declineCookies() { localStorage.setItem('mc_cookies', 'declined');  showCookieBanner.value = false; }

const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();
const itineraryStore = useItineraryStore();

const { init } = useAppInit();
onMounted(init);

// Save current route so the user can return to the same page after closing the tab
watch(route, (r) => {
  if (r.name && !['Welcome', 'Admin', 'Onboard'].includes(r.name)) {
    localStorage.setItem('mc_route', r.path);
  }
});

function resetApp() {
  const hotelId = itineraryStore.resetApp();
  router.push({ path: '/welcome', query: { hotel: hotelId } });
}

const FULL_SCREEN_ROUTES = ['Landing', 'Welcome', 'Admin', 'Onboard', 'Privacy'];
</script>

<template>
  <div class="min-h-screen cosy-gradient text-stone-800 selection:bg-stone-200 font-sans">

    <div v-if="uiStore.loading" class="flex flex-col items-center justify-center h-screen space-y-4">
      <div class="elegant-loader"></div>
      <p class="tracking-widest text-xs uppercase text-stone-400">{{ $t('common.loading') }}</p>
    </div>

    <template v-else>
      <div v-if="uiStore.error" class="max-w-xl mx-auto px-6 pt-16">
        <div class="bg-rose-50 border border-rose-100 text-rose-700 p-8 rounded-[2rem] text-center">
          <p class="font-medium">{{ uiStore.error }}</p>
          <button @click="resetApp" class="mt-4 underline font-bold uppercase text-xs tracking-widest">
            {{ $t('results.reset') }}
          </button>
        </div>
      </div>

      <main :class="FULL_SCREEN_ROUTES.includes(route.name) ? '' : 'max-w-xl mx-auto px-6 py-8 pb-28'">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </template>

    <transition name="toast">
      <div
        v-if="uiStore.showToast"
        class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-6 py-3 rounded-full text-base font-bold uppercase tracking-widest shadow-2xl z-[100] whitespace-nowrap"
      >
        {{ uiStore.toastMessage }}
      </div>
    </transition>

    <HotelChatbot v-if="route.name !== 'Admin' && route.name !== 'Onboard' && route.name !== 'Landing' && route.name !== 'Privacy'" />

    <!-- Cookie consent -->
    <Transition name="cookie">
      <div
        v-if="showCookieBanner"
        class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[150] bg-stone-900 text-white rounded-2xl shadow-2xl p-5"
      >
        <p class="text-sm leading-relaxed text-stone-300 mb-4">
          Usamos cookies para analítica y mejorar la experiencia.
          <a href="/privacy" class="underline text-stone-400 hover:text-white">Política de privacidad</a>.
        </p>
        <div class="flex gap-2">
          <button
            @click="acceptCookies"
            class="flex-1 py-2 bg-white text-stone-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-100 transition-all"
          >Aceptar</button>
          <button
            @click="declineCookies"
            class="flex-1 py-2 bg-stone-700 text-stone-300 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-600 transition-all"
          >Rechazar</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.cookie-enter-active, .cookie-leave-active { transition: all 0.35s ease; }
.cookie-enter-from, .cookie-leave-to { opacity: 0; transform: translateY(16px); }
</style>

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
  font-size: 16px;
}
@media (max-width: 640px) {
  body { font-size: 14px; }
}
.font-serif {
  font-family: "Playfair Display", serif;
}

.cosy-gradient {
  background: linear-gradient(135deg, var(--champagne) 0%, var(--stone) 100%);
  background-attachment: fixed;
}

.btn-elegant {
  @apply px-8 py-5 bg-white/60 backdrop-blur-md border border-white rounded-3xl text-base font-bold uppercase tracking-widest text-stone-700
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
  @apply px-6 py-3 rounded-full text-[16px] font-bold uppercase tracking-widest transition-all border;
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
  .no-pdf { display: none !important; }
  .no-print { display: none !important; }
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
