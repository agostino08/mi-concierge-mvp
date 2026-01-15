<script setup>
const props = defineProps(["myItinerary", "hotelData"]);
const emit = defineEmits(["back", "remove"]);

const addToCalendar = (item) => {
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.description);
  window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`, "_blank");
};

const getGoogleMapsUrl = (title) => {
  const city = props.hotelData?.city || "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + " " + city)}`;
};

const handleShare = async () => {
  const hotelName = props.hotelData?.name || "mi hotel";
  let message = `📍 MIS FAVORITOS EN ${hotelName.toUpperCase()}\n\n`;
  props.myItinerary.forEach((item, idx) => {
    message += `${idx + 1}. ${item.title.toUpperCase()}\n${item.description}\n📍 Mapa: ${getGoogleMapsUrl(item.title)}\n\n`;
  });
  
  if (navigator.share) {
    try { await navigator.share({ title: `Guía en ${props.hotelData?.city}`, text: message }); } 
    catch (err) { console.log(err); }
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }
};
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500">
    <div class="flex items-center justify-between no-print px-4">
      <button @click="$emit('back')" class="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Volver
      </button>
      <h2 class="text-3xl font-serif text-stone-900">Su Guía</h2>
    </div>

    <div class="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl space-y-12 border border-stone-100 relative overflow-hidden">
      
      <div class="absolute top-0 left-0 w-full h-2 bg-stone-800"></div>

      <div class="flex flex-col items-center text-center gap-4 pb-10 border-b border-stone-100">
        <img v-if="hotelData?.logo_url" :src="hotelData.logo_url" class="h-12 mix-blend-multiply mb-2" />
        <div>
          <h3 class="text-[11px] font-bold uppercase tracking-[0.5em] text-stone-900">{{ hotelData?.name }}</h3>
          <p class="text-stone-400 text-[10px] uppercase tracking-widest mt-1">{{ hotelData?.city }} — Selección Personal</p>
        </div>
      </div>

      <div class="space-y-16">
        <div v-for="(item, idx) in myItinerary" :key="idx" class="relative group">
          
          <div v-if="item.is_partner" class="mb-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100">
            <span class="text-[7px] font-bold uppercase tracking-widest">Recomendado por el Concierge</span>
          </div>

          <div class="flex justify-between items-start mb-4">
            <h5 class="font-serif text-2xl text-stone-800 leading-tight">{{ item.title }}</h5>
            <button @click="$emit('remove', idx)" class="text-stone-300 hover:text-rose-400 no-print transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <p class="text-stone-500 text-[15px] leading-relaxed mb-8">{{ item.description }}</p>

          <div class="flex gap-3 no-print">
            <button @click="addToCalendar(item)" class="px-6 py-3 bg-stone-50 text-stone-600 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-100 transition-all flex items-center gap-2">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Calendario
            </button>
            <a :href="getGoogleMapsUrl(item.title)" target="_blank" class="px-6 py-3 bg-stone-900 text-white rounded-xl flex items-center hover:bg-black transition-all shadow-md">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            </a>
          </div>
        </div>
      </div>

      <div class="pt-10 border-t border-stone-50 text-center">
        <p class="text-[10px] text-stone-400 italic font-serif">Preparado especialmente para su estancia.</p>
      </div>
    </div>

    <div class="max-w-xs mx-auto pb-12 no-print">
      <button @click="handleShare" 
        class="w-full py-6 bg-stone-900 text-white rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-black">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        Compartir Guía
      </button>
    </div>
  </div>
</template>