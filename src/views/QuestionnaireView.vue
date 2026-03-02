<script setup>
import { computed } from 'vue';
import { useStepNavigation } from '../composables/useStepNavigation';
import Step1Group from '../components/steps/Step1Group.vue';
import Step2Days from '../components/steps/Step2Days.vue';
import Step3Style from '../components/steps/Step3Style.vue';
import Step4Food from '../components/steps/Step4Food.vue';
import Step5Budget from '../components/steps/Step5Budget.vue';
import Step6Transport from '../components/steps/Step6Transport.vue';

const { step, prev } = useStepNavigation();

const STEPS = [Step1Group, Step2Days, Step3Style, Step4Food, Step5Budget, Step6Transport];
const currentStep = computed(() => STEPS[step.value - 1]);
</script>

<template>
  <div class="space-y-12">
    <component :is="currentStep" />

    <button
      @click="prev()"
      class="text-stone-400 text-xs font-bold uppercase tracking-widest block mx-auto hover:text-stone-800 transition-colors mt-8"
    >
      ← {{ $t('questionnaire.back') }}
    </button>
  </div>
</template>
