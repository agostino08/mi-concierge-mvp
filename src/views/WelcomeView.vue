<script setup>
import { useHotelStore } from '../stores/useHotelStore';
import { useRouter } from 'vue-router';
import { useLang } from '../composables/useLang';

const hotelStore = useHotelStore();
const router = useRouter();
const { setLang } = useLang();

function start(lang) {
  setLang(lang);
  router.push('/questionnaire/1');
}
</script>

<template>
  <section class="text-center space-y-12 py-12">
    <div class="space-y-4">
      <span class="text-xs font-bold tracking-[0.3em] uppercase text-stone-400">
        {{ $t('welcome.start') }}
      </span>
      <h2 class="text-3xl font-serif text-stone-800 tracking-tight leading-tight">
        {{ $t('welcome.title') }}
        <span class="italic text-stone-500">{{ hotelStore.hotelData?.name }}</span>
      </h2>
      <p class="text-stone-500 text-sm tracking-wide">{{ $t('welcome.subtitle') }}</p>
    </div>
    <div class="flex flex-col gap-4 max-w-xs mx-auto">
      <button @click="start('es')" class="btn-elegant">Español</button>
      <button @click="start('en')" class="btn-elegant">English</button>
      <button @click="start('fr')" class="btn-elegant">Français</button>
      <button @click="start('de')" class="btn-elegant">Deutsch</button>
      <button @click="start('it')" class="btn-elegant">Italiano</button>
      <button @click="start('pt')" class="btn-elegant">Português</button>
      <button @click="start('zh')" class="btn-elegant">中文</button>
      <button @click="start('ja')" class="btn-elegant">日本語</button>
      <button @click="start('ru')" class="btn-elegant">Русский</button>
      <button @click="start('ca')" class="btn-elegant">Català</button>
    </div>
  </section>
</template>
