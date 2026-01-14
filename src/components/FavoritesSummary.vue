<script setup>
defineProps(['myItinerary', 'hotelData', 'qrCodeUrl']);
const emit = defineEmits(['back', 'remove', 'share', 'download']);
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <button @click="$emit('back')" class="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors">← Volver</button>
      <h2 class="text-3xl font-serif text-stone-900">Mis Favoritos</h2>
    </div>

    <div id="itinerary-pdf-content" class="bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 border border-stone-100">
      <div class="flex justify-between items-center border-b border-stone-50 pb-6">
          <img :src="hotelData?.logo_url" class="h-8 mix-blend-multiply" />
          <span class="text-[10px] font-bold uppercase tracking-widest text-stone-400">Concierge Digital</span>
      </div>
      
      <div class="space-y-8">
        <div v-for="(item, idx) in myItinerary" :key="idx" class="relative group">
          <h5 class="font-serif text-xl text-stone-800 mb-2">{{ item.title }}</h5>
          <p class="text-stone-400 text-sm leading-relaxed">{{ item.description }}</p>
          <button @click="$emit('remove', idx)" class="absolute -right-2 top-0 text-rose-300 hover:text-rose-500 no-pdf">✕</button>
        </div>
      </div>

      <div class="flex justify-center pt-8 border-t border-stone-50">
        <img :src="qrCodeUrl" class="w-32 h-32 opacity-80" alt="QR" />
      </div>
    </div>

    <div class="flex flex-col gap-4 max-w-xs mx-auto">
      <button @click="$emit('share')" class="btn-dark">Compartir WhatsApp</button>
      <button @click="$emit('download')" class="btn-elegant">Descargar PDF</button>
    </div>
  </div>
</template>