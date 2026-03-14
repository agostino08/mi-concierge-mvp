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
  <div class="flex flex-col pt-6 pb-32">
    <!-- Inline progress bar -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <span class="text-[10px] font-bold uppercase tracking-widest text-stone-400">
          {{ step }} / 6
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

    <!-- Gradient fade at bottom -->
    <div class="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#fdfcfb]/90 to-transparent z-[103] pointer-events-none no-print"></div>

    <!-- Back button: fixed bottom-left pill -->
    <button
      v-if="step > 1"
      @click="prev()"
      class="fixed bottom-6 left-6 z-[105] no-print bg-white/70 backdrop-blur-sm rounded-full px-4 py-2.5 text-stone-500 text-xs font-bold uppercase tracking-widest hover:text-stone-800 hover:bg-white transition-all shadow-sm"
    >
      &larr; {{ $t('questionnaire.back') }}
    </button>
  </div>
</template>
