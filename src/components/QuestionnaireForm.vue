<script setup>
const props = defineProps(['step', 'lang', 'formData', 'options']);
const emit = defineEmits(['next', 'prev', 'submit', 'update:formData']);

const toggleSelection = (field, value) => {
  const arr = props.formData[field];
  const index = arr.indexOf(value);
  if (index > -1) arr.splice(index, 1);
  else arr.push(value);
};
</script>

<template>
  <div class="space-y-12">
    
    <div v-if="step === 1">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">{{ lang === 'es' ? '¿Con quién viajas?' : 'Who are you with?' }}</h2>
      <div class="grid gap-4">
        <button v-for="o in options.group" :key="o" @click="formData.group=o; $emit('next')" 
          :class="formData.group === o ? 'active-selection' : 'base-selection'" class="selection-card">{{ o }}</button>
      </div>
    </div>

    <div v-if="step === 2" class="text-center">
      <h2 class="text-3xl font-serif text-stone-900 mb-12 text-left">{{ lang === 'es' ? 'Estancia' : 'Stay' }}</h2>
      <div class="relative py-8">
        <input type="range" min="1" max="7" v-model="formData.days" class="elegant-range" />
        <div class="text-[8rem] font-serif leading-none text-stone-200 absolute inset-0 -z-10 flex justify-center items-center opacity-40">{{ formData.days }}</div>
      </div>
      <p class="text-stone-500 font-medium mb-12 uppercase tracking-widest text-xs">
        {{ formData.days }} {{ lang === "es" ? "Días" : "Days" }}
      </p>
      <button @click="$emit('next')" class="btn-dark w-full">Continuar</button>
    </div>

    <div v-if="step === 3 || step === 4">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">{{ step === 3 ? (lang === 'es' ? 'Intereses' : 'Interests') : (lang === 'es' ? 'Gastronomía' : 'Dining') }}</h2>
      <div class="flex flex-wrap gap-3">
        <button v-for="o in (step === 3 ? options.style : options.food)" :key="o" 
          @click="toggleSelection(step === 3 ? 'style' : 'food', o)" 
          :class="formData[step === 3 ? 'style' : 'food'].includes(o) ? 'pill-active' : 'pill-base'" class="pill-card">{{ o }}</button>
      </div>
      <button @click="$emit('next')" class="btn-dark w-full mt-12" 
        :disabled="step === 3 ? formData.style.length === 0 : formData.food.length === 0">
        Siguiente
      </button>
    </div>

    <div v-if="step === 5">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">{{ lang === 'es' ? 'Presupuesto' : 'Budget' }}</h2>
      <div class="grid gap-4">
        <button v-for="o in options.budget" :key="o" @click="formData.budget=o; $emit('next')" 
          :class="formData.budget === o ? 'active-selection' : 'base-selection'" class="selection-card">{{ o }}</button>
      </div>
    </div>

    <div v-if="step === 6">
      <h2 class="text-3xl font-serif text-stone-900 mb-8">{{ lang === 'es' ? 'Movilidad' : 'Transport' }}</h2>
      <p class="text-stone-400 text-xs mb-6 uppercase tracking-widest">
        {{ lang === 'es' ? 'Selecciona uno o varios' : 'Select one or more' }}
      </p>
      
      <div class="grid grid-cols-2 gap-4">
        <button v-for="o in options.transport" :key="o" 
          @click="toggleSelection('transport', o)" 
          :class="formData.transport.includes(o) ? 'active-selection' : 'base-selection'"
          class="selection-card text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center min-h-[80px]">
          {{ o }}
        </button>
      </div>

      <button @click="$emit('submit')" 
        class="btn-dark w-full mt-12 animate-in slide-in-from-bottom-2"
        :disabled="formData.transport.length === 0">
        {{ lang === 'es' ? 'Diseñar mi Experiencia' : 'Design my Experience' }}
      </button>
    </div>

    <button @click="$emit('prev')" class="text-stone-400 text-xs font-bold uppercase tracking-widest block mx-auto hover:text-stone-800 transition-colors mt-8">← Volver</button>
  </div>
</template>