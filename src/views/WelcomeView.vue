<script setup>
import { ref } from 'vue';
import { useHotelStore } from '../stores/useHotelStore';
import { useRouter } from 'vue-router';
import { useLang } from '../composables/useLang';

const hotelStore = useHotelStore();
const router = useRouter();
const { setLang } = useLang();

const isOpen = ref(false);
const current = ref({ code: 'en', label: 'English' });

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ca', label: 'Català' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
];

function selectLang(lang) {
  current.value = lang;
  setLang(lang.code);
  isOpen.value = false;
}

function begin() {
  router.push('/questionnaire/1');
}
</script>

<template>
  <section class="flex flex-col items-center justify-center min-h-screen text-center space-y-10 py-12">

    <!-- Hotel identity -->
    <div class="space-y-4">
      <div v-if="hotelStore.hotelData?.logo_url" class="flex justify-center">
        <img
          :src="hotelStore.hotelData.logo_url"
          :alt="hotelStore.hotelData.name"
          class="h-16 object-contain drop-shadow-sm"
        />
      </div>
      <div>
        <p class="text-[10px] font-bold uppercase tracking-[0.35em] text-stone-400 mb-2">
          {{ $t('welcome.title') }}
        </p>
        <h1 class="text-4xl font-serif text-stone-800 tracking-tight leading-tight italic">
          {{ hotelStore.hotelData?.name }}
        </h1>
        <p class="text-stone-500 text-sm tracking-wide mt-3">{{ $t('welcome.subtitle') }}</p>
      </div>
    </div>

    <!-- Language selector + Begin -->
    <div class="w-full max-w-xs space-y-3">

      <!-- Language dropdown trigger -->
      <div class="relative">
        <button
          @click="isOpen = !isOpen"
          class="w-full flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-md border border-white rounded-2xl text-sm font-semibold text-stone-700 hover:bg-white hover:shadow-md transition-all active:scale-95"
        >
          <span class="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
            {{ $t('welcome.start') }}
          </span>
          <div class="flex items-center gap-2">
            <span class="text-stone-800 font-semibold">{{ current.label }}</span>
            <svg
              class="w-4 h-4 text-stone-400 transition-transform duration-200"
              :class="{ 'rotate-180': isOpen }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <!-- Dropdown list -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50"
          >
            <div class="max-h-64 overflow-y-auto no-scrollbar py-1.5">
              <button
                v-for="lang in languages"
                :key="lang.code"
                @click="selectLang(lang)"
                class="w-full px-5 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors flex items-center justify-between"
                :class="{ 'bg-stone-50 text-stone-900 font-semibold': current.code === lang.code }"
              >
                {{ lang.label }}
                <svg
                  v-if="current.code === lang.code"
                  class="w-4 h-4 text-stone-800"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Begin button -->
      <button
        @click="begin"
        class="w-full px-8 py-5 bg-stone-800 text-white rounded-2xl text-base font-bold tracking-wide shadow-xl hover:bg-stone-700 transition-all active:scale-95"
      >
        {{ current.label }} &rarr;
      </button>
    </div>

  </section>
</template>
