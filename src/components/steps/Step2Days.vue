<script setup>
import { computed } from 'vue';
import { useFormStore } from '../../stores/useFormStore';
import { useStepNavigation } from '../../composables/useStepNavigation';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const formStore = useFormStore();
const { next } = useStepNavigation();

const dayOptions = computed(() =>
  Array.from({ length: 14 }, (_, i) => ({
    value: i + 1,
    label: i + 1 === 1 ? `1 ${t('questionnaire.day')}` : `${i + 1} ${t('questionnaire.days')}`,
  }))
);
</script>

<template>
  <div class="space-y-10 text-center">
    <h3 class="text-2xl font-serif text-stone-800 tracking-tight">
      {{ $t('questionnaire.step2') }}
    </h3>

    <div class="relative max-w-xs mx-auto">
      <select
        v-model="formStore.formData.days"
        class="w-full appearance-none bg-white/70 backdrop-blur-md border border-white rounded-3xl px-8 py-6 text-3xl font-serif text-center text-stone-800 cursor-pointer shadow-lg focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
      >
        <option v-for="opt in dayOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <button @click="next()" class="btn-dark w-full shadow-xl">
      {{ $t('questionnaire.next') }}
    </button>
  </div>
</template>
