<script setup>
import { useRouter } from 'vue-router';
import { useFormStore } from '../../stores/useFormStore';
import { useHotelStore } from '../../stores/useHotelStore';
import { useUIStore } from '../../stores/useUIStore';
import { useRecommendationsStore } from '../../stores/useRecommendationsStore';
import { QUESTIONNAIRE_OPTIONS } from '../../constants/questionnaireOptions';

const router = useRouter();
const formStore = useFormStore();
const hotelStore = useHotelStore();
const uiStore = useUIStore();
const recommendationsStore = useRecommendationsStore();

function toggle(option) {
  const arr = formStore.formData.transport;
  const idx = arr.indexOf(option);
  if (idx > -1) arr.splice(idx, 1);
  else arr.push(option);
}

async function submit() {
  router.push('/results'); // navigate first so the loading screen appears immediately
  await recommendationsStore.generateRecommendations(
    hotelStore.hotelData,
    formStore.formData,
    uiStore.lang
  );
}
</script>

<template>
  <div>
    <h2 class="text-3xl font-serif text-stone-900 mb-8">{{ $t('questionnaire.step6') }}</h2>
    <p class="text-stone-400 text-xs mb-6 uppercase tracking-widest">
      {{ $t('questionnaire.select_multiple') }}
    </p>
    <div class="grid grid-cols-2 gap-4">
      <button
        v-for="o in QUESTIONNAIRE_OPTIONS.transport"
        :key="o"
        @click="toggle(o)"
        :class="formStore.formData.transport.includes(o) ? 'active-selection' : 'base-selection'"
        class="selection-card text-center text-[11px] font-bold uppercase tracking-widest flex items-center justify-center min-h-[80px]"
      >
        {{ $t(`options.${o}`) }}
      </button>
    </div>
    <button
      @click="submit()"
      :disabled="formStore.formData.transport.length === 0"
      class="btn-dark w-full mt-12 animate-in slide-in-from-bottom-2 shadow-2xl"
    >
      {{ $t('questionnaire.generate') }}
    </button>
  </div>
</template>
