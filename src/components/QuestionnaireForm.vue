<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUIStore } from "../stores/useUIStore";
import { useItineraryStore } from "../stores/useItineraryStore";

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();
const itineraryStore = useItineraryStore();

// Convert route param to integer
const step = computed(() => parseInt(route.params.step) || 1);
const lang = computed(() => uiStore.lang);
const formData = computed(() => itineraryStore.formData);

const options = {
  group: ["Solo", "Couple", "Family", "Friends", "Business"],
  style: [
    "Nightlife", "Nature", "Mountains", "Beach", 
    "Rooftops", "Parks", "Live Music", 
    "Theater & Shows", "Guided Tours", "Museums & Culture", 
    "Local Experiences", "Luxury Shopping", "Handicrafts", 
    "Architecture", "Wellness & Spa", "Sports", 
    "History", "Relax", "Gastronomy"
  ],
  food: [
    "Local / Traditional", "Fusion", "Italian", "Asian", 
    "Mexican", "Peruvian", "Mediterranean", "Steakhouse", 
    "Bakery & Pastry", "Michelin Star", 
    "Healthy / Sustainable", "Street Food", "Vegan / Vegetarian", 
    "Seafood", "Brunch", "Wine & Tapas"
  ],
  budget: ["Budget", "Balanced", "Luxury"],
  transport: [
    "Public Transport", "Uber / Taxi", "Car Rental", 
    "Train", "Ferry", "Bicycle", "Walking", "Electric Scooter"
  ],
};

const toggleSelection = (field, value) => {
  const arr = formData.value[field];
  const index = arr.indexOf(value);
  if (index > -1) arr.splice(index, 1);
  else arr.push(value);
};

const adjustDays = (amount) => {
  const newVal = formData.value.days + amount;
  if (newVal >= 1 && newVal <= 14) {
    formData.value.days = newVal;
  }
};

const next = () => {
    router.push(`/questionnaire/${step.value + 1}`);
};

const prev = () => {
    if (step.value === 1) {
        router.push('/welcome');
    } else {
        router.push(`/questionnaire/${step.value - 1}`);
    }
};

const submit = () => {
    itineraryStore.generateItinerary();
};
</script>

<template>
  <div class="space-y-12">
    <div v-if="step === 1">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">
        {{ $t('questionnaire.step1') }}
      </h2>
      <div class="grid gap-4">
        <button
          v-for="o in options.group"
          :key="o"
          @click="
            formData.group = o;
            next();
          "
          :class="formData.group === o ? 'active-selection' : 'base-selection'"
          class="selection-card"
        >
          {{ $t(`options.${o}`) }}
        </button>
      </div>
    </div>

    <div v-if="step === 2" class="text-center">
      <h3 class="text-2xl font-serif text-stone-800 text-center tracking-tight">{{ $t(`questionnaire.step${step}`) }}</h3>

      <div
        class="relative flex items-center justify-between bg-stone-50 rounded-[2.5rem] p-4 border border-stone-100 shadow-inner max-w-xs mx-auto mb-12"
      >
        <button
          @click="adjustDays(-1)"
          class="w-16 h-16 flex items-center justify-center rounded-3xl bg-white shadow-sm border border-stone-100 text-stone-800 active:scale-90 transition-all disabled:opacity-30"
          :disabled="formData.days <= 1"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 12H4"
            />
          </svg>
        </button>

        <div class="relative flex-1 flex flex-col items-center gap-5">
          <transition name="pop" mode="out-in">
            <span
              :key="formData.days"
              class="text-5xl font-serif font-bold text-stone-800"
            >
              {{ formData.days }}
            </span>
          </transition>
          <span
            class="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold"
          >
            {{ formData.days === 1 ? $t('questionnaire.day') : $t('questionnaire.days') }}
          </span>
        </div>

        <button
          @click="adjustDays(1)"
          class="w-16 h-16 flex items-center justify-center rounded-3xl bg-stone-800 text-white shadow-lg active:scale-90 transition-all disabled:opacity-30"
          :disabled="formData.days >= 14"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        <div
          class="absolute -top-16 inset-x-0 -z-10 text-[10rem] font-serif text-stone-100 opacity-50 select-none pointer-events-none"
        >
          {{ formData.days }}
        </div>
      </div>

      <button @click="next()" class="btn-dark w-full shadow-xl">
        {{ $t('common.continue') }}
      </button>
    </div>

    <div v-if="step === 3 || step === 4">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">
        {{ $t(`questionnaire.step${step}`) }}
      </h2>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="o in step === 3 ? options.style : options.food"
          :key="o"
          @click="toggleSelection(step === 3 ? 'style' : 'food', o)"
          :class="
            formData[step === 3 ? 'style' : 'food'].includes(o)
              ? 'pill-active'
              : 'pill-base'
          "
          class="pill-card"
        >
          {{ $t(`options.${o}`) }}
        </button>
      </div>
      <button
        @click="next()"
        class="btn-dark w-full mt-12 shadow-xl"
        :disabled="
          step === 3 ? formData.style.length === 0 : formData.food.length === 0
        "
      >
        {{ $t('questionnaire.next') }}
      </button>
    </div>

    <div v-if="step === 5">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">
        {{ $t(`questionnaire.step${step}`) }}
      </h2>
      <div class="grid gap-4">
        <button
          v-for="o in options.budget"
          :key="o"
          @click="
            formData.budget = o;
            next();
          "
          :class="formData.budget === o ? 'active-selection' : 'base-selection'"
          class="selection-card"
        >
          {{ $t(`options.${o}`) }}
        </button>
      </div>
    </div>

    <div v-if="step === 6">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">
        {{ $t('questionnaire.step6') }}
      </h2>
      <p class="text-stone-400 text-xs mb-6 uppercase tracking-widest">
        {{ $t('questionnaire.select_multiple') }}
      </p>

      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="o in options.transport"
          :key="o"
          @click="toggleSelection('transport', o)"
          :class="
            formData.transport.includes(o)
              ? 'active-selection'
              : 'base-selection'
          "
          class="selection-card text-center text-[11px] font-bold uppercase tracking-widest flex items-center justify-center min-h-[80px]"
        >
          {{ $t(`options.${o}`) }}
        </button>
      </div>

      <button
        @click="submit()"
        class="btn-dark w-full mt-12 animate-in slide-in-from-bottom-2 shadow-2xl"
        :disabled="formData.transport.length === 0"
      >
        {{ $t('questionnaire.generate') }}
      </button>
    </div>

    <button
      @click="prev()"
      class="text-stone-400 text-xs font-bold uppercase tracking-widest block mx-auto hover:text-stone-800 transition-colors mt-8"
    >
      ← {{ $t('questionnaire.back') }}
    </button>
  </div>
</template>

<style scoped>
/* Animación para el cambio de número */
.pop-enter-active {
  transition: all 0.3s ease-out;
}
.pop-leave-active {
  transition: all 0.2s ease-in;
}
.pop-enter-from {
  opacity: 0;
  transform: scale(1.4);
}
.pop-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Efecto de pulsación suave para botones */
button:active:not(:disabled) {
  transform: scale(0.95);
}
</style>
