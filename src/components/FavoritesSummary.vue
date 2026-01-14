<script setup>
import { nextTick } from 'vue';

const props = defineProps(['myItinerary', 'hotelData']); // Eliminamos qrCodeUrl
const emit = defineEmits(['back', 'remove']);

// Lógica para Calendario (solo visual en web)
const addToCalendar = (item) => {
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.description);
  const gCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
  window.open(gCalUrl, "_blank");
};

// Lógica para Google Maps (solo visual en web)
const getGoogleMapsUrl = (title) => {
  const city = props.hotelData?.city || '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + " " + city)}`;
};

// FUNCIÓN MAESTRA DE PDF
const downloadPDF = async () => {
  const element = document.getElementById("itinerary-pdf-content");
  
  // Importamos dinámicamente para asegurar que esté cargado
  const html2pdf = (await import('html2pdf.js')).default;

  const opt = {
    margin: [10, 10],
    filename: `Guia_${props.hotelData?.name || 'Concierge'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 3, // Mayor calidad
      useCORS: true, 
      letterRendering: true,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Ejecutar generación
  html2pdf().set(opt).from(element).save();
};
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <button @click="$emit('back')" class="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors">
        ← Volver
      </button>
      <h2 class="text-3xl font-serif text-stone-900">Mi Selección</h2>
    </div>

    <div id="itinerary-pdf-content" class="bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 border border-stone-100 mx-auto">
      
      <div class="flex justify-between items-center border-b border-stone-100 pb-6">
          <img :src="hotelData?.logo_url" class="h-10 mix-blend-multiply" />
          <div class="text-right">
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">{{ hotelData?.name }}</p>
            <p class="text-[8px] uppercase text-stone-400">Personal Concierge Guide</p>
          </div>
      </div>
      
      <div class="space-y-10">
        <div v-for="(item, idx) in myItinerary" :key="idx" class="relative pb-6 border-b border-stone-50 last:border-0">
          
          <button @click="$emit('remove', idx)" class="absolute -right-2 -top-2 text-rose-300 hover:text-rose-500 no-pdf p-2 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round"/></svg>
          </button>

          <h5 class="font-serif text-2xl text-stone-800 mb-3 pr-8">{{ item.title }}</h5>
          <p class="text-stone-500 text-sm leading-relaxed mb-6">{{ item.description }}</p>

          <div class="flex gap-3 no-pdf">
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
        <p class="text-[9px] text-stone-400 italic font-serif">Esperamos que disfrute su estancia en {{ hotelData?.city }}</p>
      </div>
    </div>

    <div class="max-w-xs mx-auto pt-4">
      <button @click="downloadPDF" class="btn-dark w-full flex items-center justify-center gap-3 group">
        <span>Descargar y Compartir Guía</span>
        <svg class="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="text-[10px] text-stone-400 text-center mt-4 uppercase tracking-widest">El PDF se guardará en su dispositivo</p>
    </div>
  </div>
</template>

<style scoped>
/* Aseguramos que los elementos con no-pdf desaparezcan al imprimir/generar PDF */
@media print {
  .no-pdf {
    display: none !important;
  }
}
</style>