<script setup>
import { ref } from 'vue';
import { useHotelStore } from '../stores/useHotelStore';
import { useRouter } from 'vue-router';
import { useLang } from '../composables/useLang';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
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

function handleClickOutside(event) {
  if (!event.target.closest('.lang-selector')) {
    isOpen.value = false;
  }
}
</script>

<template>
  <section
    class="h-dvh flex flex-col items-center justify-center text-center px-6"
    @click="handleClickOutside"
  >
    <!-- Hotel identity -->
    <div class="mb-10 space-y-3">
      <div v-if="hotelStore.hotelData?.logo_url" class="flex justify-center mb-4">
        <img
          :src="hotelStore.hotelData.logo_url"
          :alt="hotelStore.hotelData.name"
          class="h-16 object-contain drop-shadow-sm"
        />
      </div>
      <p class="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">
        {{ $t('welcome.title') }}
      </p>
      <h1 class="text-3xl font-serif text-stone-800 tracking-tight leading-snug italic">
        {{ hotelStore.hotelData?.name }}
      </h1>
      <p class="text-stone-400 text-sm">{{ $t('welcome.subtitle') }}</p>
    </div>

    <!-- Language selector + Continue -->
    <div class="w-full max-w-[300px] space-y-4 lang-selector">

      <!-- Select language label -->
      <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">
        {{ $t('welcome.selectLanguage') }}
      </p>

      <!-- Dropdown -->
      <div class="relative">
        <button
          @click.stop="isOpen = !isOpen"
          class="w-full flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border border-stone-200/80 rounded-2xl hover:bg-white hover:shadow-md hover:border-stone-300 transition-all active:scale-[0.98] shadow-sm"
        >
          <span class="text-base font-semibold text-stone-800 tracking-tight">{{ current.label }}</span>
          <svg
            class="w-4 h-4 text-stone-400 transition-transform duration-300 flex-shrink-0"
            :class="{ 'rotate-180': isOpen }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown: 4 items visible + gradient hints more below -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0 scale-[0.98]"
        >
          <div
            v-if="isOpen"
            class="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-stone-100 z-50 overflow-hidden"
            @click.stop
          >
            <div class="relative">
              <!-- 4.5 items × 52px ≈ 234px — half of item 5 cut off signals scroll -->
              <div class="overflow-y-auto" style="max-height: 234px">
                <button
                  v-for="lang in languages"
                  :key="lang.code"
                  @click="selectLang(lang)"
                  class="w-full px-5 py-3.5 text-left text-base font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors flex items-center justify-between"
                  :class="{ 'bg-stone-50 font-semibold text-stone-900': current.code === lang.code }"
                >
                  {{ lang.label }}
                  <svg
                    v-if="current.code === lang.code"
                    class="w-4 h-4 text-stone-700 flex-shrink-0"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
              <!-- Gradient cue: more languages below -->
              <div class="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Continue button -->
      <button
        @click="begin"
        class="w-full py-4 bg-stone-800 text-white rounded-2xl text-base font-semibold tracking-wide shadow-xl hover:bg-stone-700 active:scale-95 transition-all"
      >
        {{ $t('welcome.continue') }}
      </button>

    </div>
  </section>
</template>
