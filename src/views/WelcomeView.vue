<script setup>
import { useHotelStore } from '../stores/useHotelStore';
import { useRouter } from 'vue-router';
import { useLang } from '../composables/useLang';

const hotelStore = useHotelStore();
const router = useRouter();
const { setLang } = useLang();

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ca', label: 'Català', flag: '🏴' },
];

function start(lang) {
  setLang(lang);
  router.push('/questionnaire/1');
}
</script>

<template>
  <section class="text-center space-y-10 py-10">

    <!-- Hotel identity -->
    <div class="space-y-3">
      <div v-if="hotelStore.hotelData?.logo_url" class="flex justify-center mb-4">
        <img
          :src="hotelStore.hotelData.logo_url"
          :alt="hotelStore.hotelData.name"
          class="h-14 object-contain drop-shadow-sm"
        />
      </div>

      <h2 class="text-3xl font-serif text-stone-800 tracking-tight leading-tight">
        <span class="text-stone-400 font-sans text-xl font-normal block mb-1 tracking-widest uppercase text-[11px]">
          {{ $t('welcome.title') }}
        </span>
        <span class="italic">{{ hotelStore.hotelData?.name }}</span>
      </h2>

      <p class="text-stone-500 text-sm tracking-wide">{{ $t('welcome.subtitle') }}</p>
    </div>

    <!-- Divider -->
    <div class="flex items-center gap-4 max-w-xs mx-auto">
      <div class="flex-1 h-px bg-stone-200"></div>
      <span class="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">{{ $t('welcome.start') }}</span>
      <div class="flex-1 h-px bg-stone-200"></div>
    </div>

    <!-- Language grid -->
    <div class="grid grid-cols-2 gap-3 max-w-xs mx-auto">
      <button
        v-for="lang in languages"
        :key="lang.code"
        @click="start(lang.code)"
        class="group flex items-center gap-3 px-5 py-4 bg-white/60 backdrop-blur-md border border-white rounded-2xl text-sm font-semibold text-stone-700 hover:bg-white hover:shadow-lg hover:border-stone-200 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
      >
        <span class="text-xl leading-none">{{ lang.flag }}</span>
        <span class="text-left">{{ lang.label }}</span>
      </button>
    </div>

  </section>
</template>
