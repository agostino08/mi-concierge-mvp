<script setup>
import { useFormStore } from '../../stores/useFormStore';
import { useStepNavigation } from '../../composables/useStepNavigation';
import { QUESTIONNAIRE_OPTIONS } from '../../constants/questionnaireOptions';

const formStore = useFormStore();
const { next } = useStepNavigation();

function select(option) {
  formStore.formData.group = option;
  next();
}
</script>

<template>
  <div>
    <h2 class="text-3xl font-serif text-stone-900 mb-8">{{ $t('questionnaire.step1') }}</h2>
    <div class="grid gap-4">
      <button
        v-for="o in QUESTIONNAIRE_OPTIONS.group"
        :key="o"
        @click="select(o)"
        :class="formStore.formData.group === o ? 'active-selection' : 'base-selection'"
        class="selection-card"
      >
        {{ $t(`options.${o}`) }}
      </button>
    </div>
  </div>
</template>
