<script setup>
import { computed } from 'vue';
import { useStepNavigation } from '../composables/useStepNavigation';
import { useFormStore } from '../stores/useFormStore';
import Step1Group from '../components/steps/Step1Group.vue';
import Step2Days from '../components/steps/Step2Days.vue';
import Step3Style from '../components/steps/Step3Style.vue';
import Step4Food from '../components/steps/Step4Food.vue';
import Step5Budget from '../components/steps/Step5Budget.vue';
import Step6Transport from '../components/steps/Step6Transport.vue';

const { step, next, prev } = useStepNavigation();
const formStore = useFormStore();

const STEPS = [Step1Group, Step2Days, Step3Style, Step4Food, Step5Budget, Step6Transport];
const currentStep = computed(() => STEPS[step.value - 1]);
const progress = computed(() => (step.value / STEPS.length) * 100);
const isLastStep = computed(() => step.value === STEPS.length);

// Disabled state for the fixed Next button (steps 2–4 only)
const canProceed = computed(() => {
  if (step.value === 3) return formStore.formData.style.length > 0;
  if (step.value === 4) return formStore.formData.food.length > 0;
  return true;
});
</script>

<template>
  <!-- Content: extra bottom padding on steps 2–6 to clear the fixed nav bar -->
  <div :class="step > 1 ? 'pt-6 pb-[100px]' : 'pt-6 pb-24'">
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
  </div>

  <!-- Fixed bottom navigation bar — visible on steps 2–6 -->
  <div
    v-if="step > 1"
    class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/60 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)]"
  >
    <div class="max-w-xl mx-auto px-4 py-3 flex gap-3">

      <!-- Back button -->
      <button
        @click="prev()"
        class="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:border-stone-300 hover:shadow-md font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 flex-shrink-0"
      >
        <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
        </svg>
        {{ $t('questionnaire.back') }}
      </button>

      <!-- Next button — steps 2, 3, 4 only (step 5 auto-advances; step 6 has its own generate button) -->
      <button
        v-if="step >= 2 && !isLastStep && step !== 5"
        @click="next()"
        :disabled="!canProceed"
        class="flex-1 py-3.5 bg-stone-800 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 hover:bg-stone-700 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {{ $t('questionnaire.next') }}
      </button>

    </div>
  </div>
</template>
