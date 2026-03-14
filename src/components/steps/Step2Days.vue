<script setup>
import { ref, computed, watch } from 'vue';
import { useFormStore } from '../../stores/useFormStore';
import { useStepNavigation } from '../../composables/useStepNavigation';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const formStore = useFormStore();
const { next } = useStepNavigation();

const isOpen = ref(false);

const dayOptions = computed(() =>
  Array.from({ length: 14 }, (_, i) => ({
    value: i + 1,
    label: i + 1 === 1 ? `1 ${t('questionnaire.day')}` : `${i + 1} ${t('questionnaire.days')}`,
  }))
);

const currentLabel = computed(() => {
  const opt = dayOptions.value.find(o => o.value === formStore.formData.days);
  return opt ? opt.label : `${formStore.formData.days}`;
});

function selectDay(value) {
  formStore.formData.days = value;
  isOpen.value = false;
}

function handleClickOutside(event) {
  if (!event.target.closest('.days-selector')) {
    isOpen.value = false;
  }
}
</script>

<template>
  <div class="space-y-8 text-center" @click="handleClickOutside">
    <h3 class="text-2xl font-serif text-stone-800 tracking-tight">
      {{ $t('questionnaire.step2') }}
    </h3>

    <div class="relative max-w-[280px] mx-auto days-selector">
      <!-- Trigger — same style as WelcomeView language selector -->
      <button
        @click.stop="isOpen = !isOpen"
        class="w-full flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border border-stone-200/80 rounded-2xl hover:bg-white hover:shadow-md hover:border-stone-300 transition-all active:scale-[0.98] shadow-sm"
      >
        <span class="text-base font-semibold text-stone-800 tracking-tight">{{ currentLabel }}</span>
        <svg
          class="w-4 h-4 text-stone-400 transition-transform duration-300 flex-shrink-0"
          :class="{ 'rotate-180': isOpen }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown: 3.5 items visible + gradient hint for more -->
      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0 scale-[0.98]"
      >
        <div
          v-if="isOpen"
          class="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-stone-100 z-50 overflow-hidden"
          @click.stop
        >
          <!-- 3.5 items × ~52px = 182px — half of item 4 is cut off, signalling scroll -->
          <div class="relative">
            <div class="overflow-y-auto" style="max-height: 182px">
              <button
                v-for="opt in dayOptions"
                :key="opt.value"
                @click="selectDay(opt.value)"
                class="w-full px-5 py-3.5 text-left text-base font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors flex items-center justify-between"
                :class="{ 'bg-stone-50 font-semibold text-stone-900': formStore.formData.days === opt.value }"
              >
                {{ opt.label }}
                <svg
                  v-if="formStore.formData.days === opt.value"
                  class="w-4 h-4 text-stone-700 flex-shrink-0"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
            <!-- Gradient fade -->
            <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </transition>
    </div>

    <button @click="next()" class="btn-dark fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[528px] z-[104] shadow-xl no-print">
      {{ $t('questionnaire.next') }}
    </button>
  </div>
</template>
