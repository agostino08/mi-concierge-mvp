<script setup>
// No importamos html2pdf aquí arriba para evitar errores de carga de Vite
import { nextTick } from 'vue';

const props = defineProps(['myItinerary', 'hotelData']);
const emit = defineEmits(['back', 'remove']);

// ... tus funciones de calendario y mapas ...

const downloadPDF = () => {
  const element = document.getElementById("itinerary-pdf-content");
  // html2pdf ahora es una variable global gracias al script del index.html
  window.html2pdf()
    .set({
      margin: 10,
      filename: 'Guia-Viaje.pdf',
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .from(element)
    .save();
};
</script>

<template>
  <div class="max-w-xs mx-auto pt-4">
    <button @click="downloadPDF" class="btn-dark w-full flex items-center justify-center gap-3">
      Descargar Guía PDF
    </button>
  </div>
</template>