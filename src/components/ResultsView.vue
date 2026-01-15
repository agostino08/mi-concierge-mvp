<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
// ... tus otros props y emits ...

const props = defineProps(['recommendations', 'myItinerary', 'generating', 'hotelData']);

// --- LÓGICA DE LA PANTALLA DE ESPERA ---
const currentFactIndex = ref(0);
const facts = [
  { title: "Tradición", text: "Barcelona tiene 9 monumentos declarados Patrimonio de la Humanidad por la UNESCO." },
  { title: "Gastronomía", text: "La hora punta para cenar en la ciudad suele ser a partir de las 21:00h." },
  { title: "Curiosidad", text: "El Parque Güell fue originalmente diseñado para ser una urbanización de lujo, no un parque." },
  { title: "Transporte", text: "La red de metro de la ciudad es una de las más accesibles y rápidas de Europa." },
  { title: "Cultura", text: "Sant Jordi (23 de abril) es el día más romántico: la ciudad se llena de libros y rosas." }
];

// Imágenes de alta calidad para el fondo de espera
const loadingImages = [
  "https://images.pexels.com/photos/16041820/pexels-photo-16041820.jpeg",
  "https://images.pexels.com/photos/17356918/pexels-photo-17356918.jpeg",
  "https://images.pexels.com/photos/34459139/pexels-photo-34459139.jpeg",
  "https://images.pexels.com/photos/8738207/pexels-photo-8738207.jpeg"
];
const currentImgIndex = ref(0);

let timer;
onMounted(() => {
  timer = setInterval(() => {
    currentFactIndex.value = (currentFactIndex.value + 1) % facts.length;
    currentImgIndex.value = (currentImgIndex.value + 1) % loadingImages.length;
  }, 4500);
});

onUnmounted(() => clearInterval(timer));
// --- FIN LÓGICA ESPERA ---

// ... el resto de tu código (heroImage, addToCalendar, etc.) ...
</script>

<template>
  <div class="max-w-4xl mx-auto">
    
    <div v-if="generating" class="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 overflow-hidden">
      
      <div class="absolute inset-0 z-0">
        <transition-group name="fade">
          <img v-for="(img, idx) in loadingImages" :key="img" v-show="currentImgIndex === idx"
               :src="img" class="absolute inset-0 w-full h-full object-cover brightness-[0.4] scale-110 transition-all duration-[2000ms]" />
        </transition-group>
      </div>

      <div class="relative z-10 text-center max-w-md w-full space-y-12">
        
        <div class="relative mx-auto w-24 h-24">
          <div class="absolute inset-0 border-t-2 border-white/20 rounded-full"></div>
          <div class="absolute inset-0 border-t-2 border-amber-400 rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-white/40 text-[10px] uppercase tracking-tighter animate-pulse">AI</span>
          </div>
        </div>

        <div class="space-y-4 min-h-[120px] flex flex-col justify-center">
          <transition name="slide-up" mode="out-in">
            <div :key="currentFactIndex" class="space-y-2">
              <p class="text-amber-400 text-[10px] font-bold uppercase tracking-[0.4em]">¿Sabía que...?</p>
              <h4 class="text-white font-serif text-2xl italic px-4">{{ facts[currentFactIndex].text }}</h4>
            </div>
          </transition>
        </div>

        <div class="pt-10">
          <p class="text-white/40 text-[10px] uppercase tracking-[0.2em]">Personalizando su estancia en {{ hotelData?.city }}</p>
        </div>
      </div>
    </div>

    <div v-else class="space-y-8 animate-in fade-in duration-700">
      </div>
  </div>
</template>

<style scoped>
/* Transición de Imágenes de Fondo */
.fade-enter-active, .fade-leave-active {
  transition: opacity 2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Transición de Textos */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.6s ease;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>