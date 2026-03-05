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
const progress = computed(() => (step.value / STEPS.length) * 100);
</script>

<template>
  <div class="space-y-8 pt-8">
    <!-- Inline progress bar -->
    <div class="space-y-1">
      <div class="flex justify-between items-center mb-1">
        <span class="text-[10px] font-bold uppercase tracking-widest text-stone-400">
          {{ step }} / {{ 6 }}
        </span>
      </div>
      <div class="h-[3px] w-full bg-stone-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-stone-700 rounded-full transition-all duration-700"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>

    <component :is="currentStep" />

    <button
      v-if="step > 1"
      @click="prev()"
      class="text-stone-400 text-xs font-bold uppercase tracking-widest block mx-auto hover:text-stone-800 transition-colors"
    >
      &larr; {{ $t('questionnaire.back') }}
    </button>
  </div>
</template>
