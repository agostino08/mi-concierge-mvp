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

const downloadPDF = () => {
  const element = document.getElementById("itinerary-pdf-content");
  
  // Opciones de configuración para que se vea premium
  const opt = {
    margin: [15, 15],
    filename: `Guia_${props.hotelData?.name || 'Concierge'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 3, // Alta resolución
      useCORS: true, 
      logging: false 
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Esto descarga el archivo directamente sin abrir el menú de impresión
  window.html2pdf().from(element).set(opt).save();
};

const shareByWhatsApp = () => {
  const hotelName = props.hotelData?.name || 'mi hotel';
  let message = `*📍 Mi Selección en ${hotelName}*%0A%0A`;
  
  props.myItinerary.forEach((item, idx) => {
    message += `*${idx + 1}. ${item.title}*%0A${item.description}%0A%0A`;
  });
  
  message += `_Generado por Concierge Digital_`;
  
  window.open(`https://wa.me/?text=${message}`, '_blank');
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

    <div class="max-w-xs mx-auto pt-4 no-print space-y-3">
  
  <button @click="shareByWhatsApp" class="w-full py-5 bg-[#25D366] text-white rounded-3xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.44-9.889 9.886-.001 2.225.586 4.391 1.697 6.27l-.425 2.113 2.227-.584z"/></svg>
    Compartir por WhatsApp
  </button>

  <button @click="downloadPDF" class="w-full py-5 bg-stone-900 text-white rounded-3xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
    Descargar PDF Directo
  </button>

  <p class="text-[10px] text-stone-400 text-center mt-4 italic">Tus favoritos se guardarán en este dispositivo automáticamente.</p>
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