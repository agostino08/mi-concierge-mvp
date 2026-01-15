<script setup>
const props = defineProps(["myItinerary", "hotelData"]);
const emit = defineEmits(["back", "remove"]);

const getImageUrl = (keyword) => {
  const encoded = encodeURIComponent(keyword || 'travel architecture');
  return `https://image.pollinations.ai/prompt/${encoded}?width=200&height=200&nologo=true`;
};

const addToCalendar = (item) => {
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.description);
  window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`, "_blank");
};

const getGoogleMapsUrl = (title) => 
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + " " + (props.hotelData?.city || ""))}`;

const handleShare = async () => {
  const hotelName = props.hotelData?.name || "mi hotel";
  let message = `📍 MIS FAVORITOS EN ${hotelName.toUpperCase()}\n\n`;
  props.myItinerary.forEach((item, idx) => {
    message += `${idx + 1}. ${item.title.toUpperCase()}\n${item.description}\n🔗 ${getGoogleMapsUrl(item.title)}\n\n`;
  });
  
  if (navigator.share) {
    try { await navigator.share({ title: `Mis planes`, text: message }); } 
    catch (err) { console.log(err); }
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <div class="flex items-center justify-between no-print">
      <button @click="$emit('back')" class="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors">← Volver</button>
      <h2 class="text-3xl font-serif text-stone-900">Mi Selección</h2>
    </div>

    <div class="bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 border border-stone-100 mx-auto max-w-2xl">
      <div class="flex justify-between items-center border-b border-stone-100 pb-6">
        <img v-if="hotelData?.logo_url" :src="hotelData.logo_url" class="h-10 mix-blend-multiply" />
        <div class="text-right">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800">{{ hotelData?.name }}</p>
          <p class="text-[8px] uppercase text-stone-400">Concierge Digital</p>
        </div>
      </div>

      <div class="space-y-8">
        <div v-for="(item, idx) in myItinerary" :key="idx" class="relative flex gap-4 border-b border-stone-50 last:border-0 pb-6">
          
          <div class="w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden relative">
            <img :src="getImageUrl(item.image_keyword)" class="w-full h-full object-cover" />
            <div v-if="item.is_partner" class="absolute bottom-0 left-0 w-full bg-stone-900 text-white text-[6px] font-bold uppercase text-center py-1">
              Recomendado
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start mb-2">
              <h5 class="font-serif text-lg text-stone-800 leading-tight pr-6">{{ item.title }}</h5>
              <button @click="$emit('remove', idx)" class="text-rose-300 hover:text-rose-500 no-print">✕</button>
            </div>
            
            <p class="text-stone-500 text-xs leading-relaxed mb-4 line-clamp-2">{{ item.description }}</p>

            <div class="flex gap-2 no-print">
              <button @click="addToCalendar(item)" class="px-4 py-2 bg-stone-50 text-stone-600 rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-stone-100">Agendar</button>
              <a :href="getGoogleMapsUrl(item.title)" target="_blank" class="px-4 py-2 bg-stone-800 text-white rounded-lg flex items-center hover:bg-black">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="pt-6 text-center">
        <p class="text-[9px] text-stone-400 italic font-serif">Gracias por visitarnos</p>
      </div>
    </div>

    <div class="max-w-xs mx-auto pt-4 no-print space-y-4">
      <button @click="handleShare" class="w-full py-6 bg-stone-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        Guardar o Compartir
      </button>
    </div>
  </div>
</template>
