<script setup>
import { useFormStore } from '../../stores/useFormStore';
import { useStepNavigation } from '../../composables/useStepNavigation';
import { QUESTIONNAIRE_OPTIONS } from '../../constants/questionnaireOptions';

const formStore = useFormStore();
const { next } = useStepNavigation();

function toggle(option) {
  const arr = formStore.formData.food;
  const idx = arr.indexOf(option);
  if (idx > -1) arr.splice(idx, 1);
  else arr.push(option);
}
</script>

<template>
  <div>
    <h2 class="text-3xl font-serif text-stone-900 mb-8">{{ $t('questionnaire.step4') }}</h2>
    <div class="flex flex-wrap gap-3">
      <button
        v-for="o in QUESTIONNAIRE_OPTIONS.food"
        :key="o"
        @click="toggle(o)"
        :class="formStore.formData.food.includes(o) ? 'pill-active' : 'pill-base'"
        class="pill-card"
      >
        {{ $t(`options.${o}`) }}
      </button>
    </div>
    <button
      @click="next()"
      :disabled="formStore.formData.food.length === 0"
      class="btn-dark fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[528px] z-[104] shadow-xl no-print"
    >
      {{ $t('questionnaire.next') }}
    </button>
  </div>
</template>
