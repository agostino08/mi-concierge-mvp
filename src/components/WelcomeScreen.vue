<script setup>
defineProps(['hotelData']);
defineEmits(['start']);
</script>

<template>
  <section class="text-center space-y-12 py-12">
    <div class="space-y-4">
      <span class="text-xs font-bold tracking-[0.3em] uppercase text-stone-400">Concierge Privado</span>
      <h1 class="text-5xl font-serif leading-tight text-stone-900">{{ hotelData?.name }}</h1>
    </div>
    <div class="flex flex-col gap-4 max-w-xs mx-auto">
      <button @click="$emit('start', 'es')" class="btn-elegant">Español</button>
      <button @click="$emit('start', 'en')" class="btn-elegant">English</button>
    </div>
  </section>
</template>