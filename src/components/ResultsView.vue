<script setup>
import { ref } from 'vue';
const props = defineProps(['recommendations', 'myItinerary', 'generating', 'hotelData']);
// Añadimos 'reset' a los eventos emitidos
const emit = defineEmits(['toggleFavorite', 'goToSummary', 'reset']);

const activeTab = ref('activities');

const isFavorite = (item) => props.myItinerary.some((i) => i.title === item.title);

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

      <div class="grid gap-6">
        <div v-for="item in recommendations[activeTab]" :key="item.title" class="bg-white/70 backdrop-blur-md border border-white/50 p-8 rounded-[2.5rem] shadow-sm relative group transition-all hover:shadow-md">
          
          <div v-if="item.is_partner" class="absolute -top-3 left-8 bg-stone-800 text-white px-3 py-1 rounded-b-lg shadow-lg z-10">
            <p class="text-[8px] font-bold uppercase tracking-widest">Recomendado</p>
          </div>

          <button v-if="activeTab !== 'transport'" @click="$emit('toggleFavorite', item)" class="absolute top-6 right-6 p-3 rounded-full transition-all z-20" 
            :class="isFavorite(item) ? 'bg-rose-50 text-rose-500 scale-110 shadow-sm' : 'bg-stone-100 text-stone-300 hover:bg-stone-200'">
            <svg class="w-5 h-5" :fill="isFavorite(item) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>

          <h4 class="text-xl font-serif text-stone-800 mb-3 pr-10 mt-2">{{ item.title }}</h4>
          <p class="text-stone-500 text-sm leading-relaxed mb-8">{{ item.description }}</p>

          <div v-if="activeTab !== 'transport'" class="flex gap-3">
            <button @click="addToCalendar(item)" class="flex-1 py-4 bg-stone-50 text-stone-600 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors">Agendar</button>
            <a :href="getGoogleMapsUrl(item.title)" target="_blank" class="p-4 bg-stone-800 text-white rounded-2xl hover:bg-black transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg></a>
          </div>
        </div>
      </div>

      <div class="pt-8 pb-4 text-center border-t border-stone-200/50">
        <button 
          @click="$emit('reset')"
          class="text-stone-400 hover:text-stone-800 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Iniciar Nueva Búsqueda
        </button>
      </div>

    </div>
  </div>
</template>