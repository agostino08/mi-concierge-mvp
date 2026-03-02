<script setup>
import { useFormStore } from '../../stores/useFormStore';
import { useStepNavigation } from '../../composables/useStepNavigation';

const formStore = useFormStore();
const { next } = useStepNavigation();

function adjustDays(amount) {
  const newVal = formStore.formData.days + amount;
  if (newVal >= 1 && newVal <= 14) formStore.formData.days = newVal;
}
</script>

<template>
  <div class="text-center">
    <h3 class="text-2xl font-serif text-stone-800 text-center tracking-tight">
      {{ $t('questionnaire.step2') }}
    </h3>

    <div class="relative flex items-center justify-between bg-stone-50 rounded-[2.5rem] p-4 border border-stone-100 shadow-inner max-w-xs mx-auto mb-12 mt-8">
      <button
        @click="adjustDays(-1)"
        :disabled="formStore.formData.days <= 1"
        class="w-16 h-16 flex items-center justify-center rounded-3xl bg-white shadow-sm border border-stone-100 text-stone-800 active:scale-90 transition-all disabled:opacity-30"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>

      <div class="relative flex-1 flex flex-col items-center gap-5">
        <transition name="pop" mode="out-in">
          <span :key="formStore.formData.days" class="text-5xl font-serif font-bold text-stone-800">
            {{ formStore.formData.days }}
          </span>
        </transition>
        <span class="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
          {{ formStore.formData.days === 1 ? $t('questionnaire.day') : $t('questionnaire.days') }}
        </span>
      </div>

      <button
        @click="adjustDays(1)"
        :disabled="formStore.formData.days >= 14"
        class="w-16 h-16 flex items-center justify-center rounded-3xl bg-stone-800 text-white shadow-lg active:scale-90 transition-all disabled:opacity-30"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <div class="absolute -top-16 inset-x-0 -z-10 text-[10rem] font-serif text-stone-100 opacity-50 select-none pointer-events-none">
        {{ formStore.formData.days }}
      </div>
    </div>

    <button @click="next()" class="btn-dark w-full shadow-xl">
      {{ $t('questionnaire.next') }}
    </button>
  </div>
</template>

<style scoped>
.pop-enter-active { transition: all 0.3s ease-out; }
.pop-leave-active { transition: all 0.2s ease-in; }
.pop-enter-from { opacity: 0; transform: scale(1.4); }
.pop-leave-to { opacity: 0; transform: scale(0.8); }
</style>
