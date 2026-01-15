<script setup>
import { ref } from 'vue';
const props = defineProps(['recommendations', 'myItinerary', 'generating', 'hotelData']);
const emit = defineEmits(['toggleFavorite', 'goToSummary', 'reset']);

const activeTab = ref('activities');

const isFavorite = (item) => props.myItinerary.some((i) => i.title === item.title);

// Usamos LoremFlickr para fotos REALES (Creative Commons)
// Añadimos 'random' para asegurar que no se repitan
const getRealImageUrl = (keyword, index) => {
  const query = encodeURIComponent(keyword || 'travel');
  // Usamos el índice para "bloquear" una imagen diferente para cada tarjeta
  return `https://loremflickr.com/800/600/${query}?lock=${index + 10}`;
};

const addToCalendar = (item) => {
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.description);
  const gCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
  window.open(gCalUrl, "_blank");
};

const getGoogleMapsUrl = (title) => 
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + " " + props.hotelData.city)}`;
</script>

<template>
  <div>
    <div v-if="generating" class="text-center py-32 space-y-6">
      <div class="elegant-loader mx-auto"></div>
      <p class="font-serif italic text-xl text-stone-500">Diseñando su experiencia...</p>
    </div>

    <div v-else class="space-y-10">
      
      <div class="bg-stone-800 text-stone-50 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="font-serif text-2xl">Mi Selección</h3>
          <span class="bg-stone-600 px-3 py-1 rounded-full text-[10px] font-bold">{{ myItinerary.length }}</span>
        </div>
        <button v-if="myItinerary.length > 0" @click="$emit('goToSummary')" class="w-full bg-white text-stone-900 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-stone-100 transition-colors">
          Ver Favoritos y Guardar
        </button>
        <p v-else class="text-stone-400 text-xs text-center italic">Dale al ♡ para guardar tus favoritos</p>
      </div>

      <div class="flex p-1 bg-stone-200/50 rounded-2xl">
        <button v-for="tab in ['activities', 'food', 'transport']" :key="tab" @click="activeTab = tab" 
          :class="activeTab === tab ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'" 
          class="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
          {{ tab === 'activities' ? 'Experiencias' : tab === 'food' ? 'Gastronomía' : 'Moverse' }}
        </button>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div v-for="(item, idx) in recommendations[activeTab]" :key="item.title" 
             class="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-white/50 flex flex-col">
          
          <div class="relative h-48 overflow-hidden bg-stone-200">
            <img 
              :src="getRealImageUrl(item.image_keyword, idx)" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              alt="Lugar recomendado"
            />
            
            <div v-if="item.is_partner" class="absolute top-4 left-4 bg-stone-900 text-white px-3 py-1 rounded-full shadow-lg z-10">
              <p class="text-[8px] font-bold uppercase tracking-widest">Recomendado por el hotel</p>
            </div>

            <button v-if="activeTab !== 'transport'" @click="$emit('toggleFavorite', item)" 
              class="absolute top-4 right-4 p-2 rounded-full transition-all shadow-md z-10 backdrop-blur-sm"
              :class="isFavorite(item) ? 'bg-white text-rose-500' : 'bg-white/80 text-stone-400 hover:bg-white hover:text-rose-300'">
              <svg class="w-5 h-5" :fill="isFavorite(item) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
          </div>

          <div class="p-6 flex flex-col flex-1">
            <h4 class="text-xl font-serif text-stone-800 mb-2 leading-tight">{{ item.title }}</h4>
            <p class="text-stone-500 text-xs leading-relaxed mb-6 line-clamp-3 flex-1">{{ item.description }}</p>

            <div v-if="activeTab !== 'transport'" class="flex gap-3 pt-4 border-t border-stone-100 mt-auto">
              <button @click="addToCalendar(item)" class="flex-1 py-3 bg-stone-50 text-stone-600 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors">
                Agendar en calendario
              </button>
              <a :href="getGoogleMapsUrl(item.title)" target="_blank" class="px-4 py-3 bg-stone-800 text-white rounded-xl hover:bg-black transition-colors flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="pt-8 pb-4 text-center">
        <button @click="$emit('reset')" class="text-stone-400 hover:text-stone-800 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 mx-auto">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Iniciar una Nueva Búsqueda
        </button>
      </div>
    </div>
  </div>
</template>