<script setup>
const props = defineProps(["step", "lang", "formData", "options"]);
const emit = defineEmits(["next", "prev", "submit", "update:formData"]);

const toggleSelection = (field, value) => {
  const arr = props.formData[field];
  const index = arr.indexOf(value);
  if (index > -1) arr.splice(index, 1);
  else arr.push(value);
};

// Funciones para el selector de días
const adjustDays = (amount) => {
  const newVal = props.formData.days + amount;
  if (newVal >= 1 && newVal <= 14) {
    props.formData.days = newVal;
  }
};
</script>

<template>
  <div class="space-y-12">
    <div v-if="step === 1">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">
        {{ lang === "es" ? "¿Con quién viajas?" : "Who are you with?" }}
      </h2>
      <div class="grid gap-4">
        <button
          v-for="o in options.group"
          :key="o"
          @click="
            formData.group = o;
            $emit('next');
          "
          :class="formData.group === o ? 'active-selection' : 'base-selection'"
          class="selection-card"
        >
          {{ o }}
        </button>
      </div>
    </div>

    <div v-if="step === 2" class="text-center">
      <h2 class="text-3xl font-serif text-stone-900 mb-12 text-left">
        {{ lang === "es" ? "Estancia" : "Stay" }}
      </h2>

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
            {{
              lang === "es"
                ? formData.days === 1
                  ? "Día"
                  : "Días"
                : formData.days === 1
                ? "Day"
                : "Days"
            }}
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

      <button @click="$emit('next')" class="btn-dark w-full shadow-xl">
        Continuar
      </button>
    </div>

    <div v-if="step === 3 || step === 4">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">
        {{
          step === 3
            ? lang === "es"
              ? "Intereses"
              : "Interests"
            : lang === "es"
            ? "Gastronomía"
            : "Dining"
        }}
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
          {{ o }}
        </button>
      </div>
      <button
        @click="$emit('next')"
        class="btn-dark w-full mt-12 shadow-xl"
        :disabled="
          step === 3 ? formData.style.length === 0 : formData.food.length === 0
        "
      >
        {{ lang === "es" ? "Siguiente" : "Next" }}
      </button>
    </div>

    <div v-if="step === 5">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">
        {{ lang === "es" ? "Presupuesto" : "Budget" }}
      </h2>
      <div class="grid gap-4">
        <button
          v-for="o in options.budget"
          :key="o"
          @click="
            formData.budget = o;
            $emit('next');
          "
          :class="formData.budget === o ? 'active-selection' : 'base-selection'"
          class="selection-card"
        >
          {{ o }}
        </button>
      </div>
    </div>

    <div v-if="step === 6">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">
        {{ lang === "es" ? "Movilidad" : "Transport" }}
      </h2>
      <p class="text-stone-400 text-xs mb-6 uppercase tracking-widest">
        {{ lang === "es" ? "Selecciona uno o varios" : "Select one or more" }}
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
          {{ o }}
        </button>
      </div>

      <button
        @click="$emit('submit')"
        class="btn-dark w-full mt-12 animate-in slide-in-from-bottom-2 shadow-2xl"
        :disabled="formData.transport.length === 0"
      >
        {{ lang === "es" ? "Diseñar mi Experiencia" : "Design my Experience" }}
      </button>
    </div>

    <button
      @click="$emit('prev')"
      class="text-stone-400 text-xs font-bold uppercase tracking-widest block mx-auto hover:text-stone-800 transition-colors mt-8"
    >
      {{ lang === "es" ? "← Volver" : "← Back" }}
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
