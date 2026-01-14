<script setup>
const props = defineProps(['myItinerary', 'hotelData']);
const emit = defineEmits(['back', 'remove']);

// FUNCIÓN NATIVA: Abre el menú de PDF/Imprimir/Compartir del sistema
const handleDownload = () => {
  window.print();
};

const addToCalendar = (item) => {
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.description);
  const gCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
  window.open(gCalUrl, "_blank");
};

const getGoogleMapsUrl = (title) => {
  const city = props.hotelData?.city || '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + " " + city)}`;
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <div class="flex items-center justify-between no-print">
      <button @click="$emit('back')" class="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors">
        ← Volver
      </button>
      <h2 class="text-3xl font-serif text-stone-900">Mi Selección</h2>
    </div>

    <div id="itinerary-pdf-content" class="printable-area bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 border border-stone-100 mx-auto max-w-2xl">
      
      <div class="flex justify-between items-center border-b border-stone-100 pb-6">
          <img v-if="hotelData?.logo_url" :src="hotelData.logo_url" class="h-10 mix-blend-multiply" />
          <div class="text-right">
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">{{ hotelData?.name }}</p>
            <p class="text-[8px] uppercase text-stone-400">Concierge Digital</p>
          </div>
      </div>
      
      <div class="space-y-10">
        <div v-for="(item, idx) in myItinerary" :key="idx" class="relative pb-6 border-b border-stone-50 last:border-0">
          
          <button @click="$emit('remove', idx)" class="absolute -right-2 -top-2 text-rose-300 hover:text-rose-500 no-print p-2 transition-colors">
            ✕
          </button>

          <h5 class="font-serif text-2xl text-stone-800 mb-3 pr-8">{{ item.title }}</h5>
          <p class="text-stone-500 text-sm leading-relaxed mb-6">{{ item.description }}</p>

          <div class="flex gap-3 no-print">
            <button @click="addToCalendar(item)" 
              class="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 transition-all">
              Agendar
            </button>
            <a :href="getGoogleMapsUrl(item.title)" target="_blank" 
              class="px-5 py-3 bg-stone-800 text-white rounded-xl hover:bg-black transition-all flex items-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div class="pt-6 text-center">
        <p class="text-[9px] text-stone-400 italic font-serif">Gracias por visitarnos</p>
      </div>
    </div>

    <div class="max-w-xs mx-auto pt-4 no-print">
      <button @click="handleDownload" class="btn-dark w-full py-6 flex items-center justify-center gap-3">
        Descargar o Compartir Guía
      </button>
      <p class="text-[10px] text-stone-400 text-center mt-4">Tip: Selecciona "Guardar como PDF" o envía directamente por WhatsApp</p>
    </div>
  </div>
</template>

<style scoped>
/* ESTILOS DE IMPRESIÓN MÁGICOS */
@media print {
  /* Oculta todo lo que tenga la clase no-print o no-pdf */
  .no-print, .no-pdf {
    display: none !important;
  }

  /* Ajusta el contenedor para que ocupe toda la página blanca */
  .printable-area {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
  }

  /* Asegura que el fondo sea blanco */
  body {
    background: white !important;
  }
}
</style>