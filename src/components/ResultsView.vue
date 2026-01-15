<script setup>
import { ref } from 'vue';
const props = defineProps(['recommendations', 'myItinerary', 'generating', 'hotelData']);
const emit = defineEmits(['toggleFavorite', 'goToSummary', 'reset']);

const activeTab = ref('activities');
const isFavorite = (item) => props.myItinerary.some((i) => i.title === item.title);

// Una sola imagen Hero de alta calidad para la ciudad
const heroImage = `https://images.unsplash.com/photo-1583997053204-c5850a011395?auto=format&fit=crop&q=80&w=1200`;

const addToCalendar = (item) => {
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.description);
  window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`, "_blank");
};

const getGoogleMapsUrl = (title) => 
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + " " + props.hotelData.city)}`;
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div v-if="generating" class="text-center py-32 space-y-6">
      <div class="elegant-loader mx-auto"></div>
      <p class="font-serif italic text-xl text-stone-500">Diseñando su experiencia a medida...</p>
    </div>

    <div v-else class="space-y-8 animate-in fade-in duration-700">
      
      <div class="relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
        <img :src="heroImage" class="absolute inset-0 w-full h-full object-cover" />
        <div class="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center p-6">
          <span class="text-white/80 text-[10px] uppercase tracking-[0.4em] mb-2">Descubra</span>
          <h2 class="text-white text-4xl font-serif italic">{{ hotelData?.city }}</h2>
        </div>
      </div>

      <div class="bg-stone-900 text-stone-50 p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="text-center md:text-left">
          <h3 class="font-serif text-2xl mb-1">Su Selección</h3>
          <p class="text-stone-400 text-[10px] uppercase tracking-widest">{{ myItinerary.length }} lugares guardados</p>
        </div>
        <button v-if="myItinerary.length > 0" @click="$emit('goToSummary')" 
          class="bg-white text-stone-900 px-8 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-stone-200 transition-all active:scale-95 shadow-lg">
          Ver Itinerario Completo
        </button>
      </div>

      <div class="flex p-1.5 bg-stone-200/50 rounded-2xl sticky top-4 z-20 backdrop-blur-md">
        <button v-for="tab in ['activities', 'food', 'transport']" :key="tab" @click="activeTab = tab" 
          :class="activeTab === tab ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'" 
          class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
          {{ tab === 'activities' ? 'Experiencias' : tab === 'food' ? 'Gastronomía' : 'Logística' }}
        </button>
      </div>

      <div class="grid gap-6">
        <div v-for="item in recommendations[activeTab]" :key="item.title" 
             class="relative bg-white border border-stone-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group">
          
          <div v-if="item.is_partner" class="absolute -top-2 -left-2 bg-amber-400 text-amber-900 px-4 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-2 border-2 border-white">
            <span class="text-[8px] font-black uppercase tracking-tighter">Recomendación del Hotel</span>
          </div>

          <button v-if="activeTab !== 'transport'" @click="$emit('toggleFavorite', item)" 
            class="absolute top-8 right-8 p-3 rounded-full transition-all duration-300" 
            :class="isFavorite(item) ? 'bg-rose-50 text-rose-500' : 'bg-stone-50 text-stone-300 hover:text-rose-300'">
            <svg class="w-6 h-6" :fill="isFavorite(item) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          <div class="max-w-[85%]">
            <h4 class="text-2xl font-serif text-stone-800 mb-3 leading-tight group-hover:text-stone-600 transition-colors">{{ item.title }}</h4>
            <p class="text-stone-500 text-sm leading-relaxed mb-8">{{ item.description }}</p>
          </div>

          <div v-if="activeTab !== 'transport'" class="flex gap-4">
            <button @click="addToCalendar(item)" 
              class="flex-1 py-4 bg-stone-50 text-stone-600 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-100 transition-all flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Agendar
            </button>
            <a :href="getGoogleMapsUrl(item.title)" target="_blank" 
              class="px-6 py-4 bg-stone-800 text-white rounded-2xl hover:bg-black transition-all shadow-lg flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            </a>
          </div>
        </div>
      </div>

      <div class="pt-12 pb-8 text-center border-t border-stone-100">
        <button @click="$emit('reset')" class="text-stone-400 hover:text-stone-800 text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 mx-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Nueva Planificación
        </button>
      </div>
    </div>
  </div>
</template>