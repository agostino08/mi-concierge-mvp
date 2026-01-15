<script setup>
const props = defineProps(["myItinerary", "hotelData"]);
const emit = defineEmits(["back", "remove"]);

const addToCalendar = (item) => {
  const title = encodeURIComponent(item.title);
  const details = encodeURIComponent(item.description);
  const gCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
  window.open(gCalUrl, "_blank");
};

const getGoogleMapsUrl = (title) => {
  const city = props.hotelData?.city || "";
  // Formato limpio de búsqueda en Google Maps
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    title + " " + city
  )}`;
};

const handleShare = async () => {
  const hotelName = props.hotelData?.name || "mi hotel";

  // 1. Construimos el cuerpo del mensaje
  let message = `📍 MIS FAVORITOS EN ${hotelName.toUpperCase()}\n\n`;

  props.myItinerary.forEach((item, idx) => {
    const mapsUrl = getGoogleMapsUrl(item.title);
    message += `${idx + 1}. ${item.title.toUpperCase()}\n`;
    message += `${item.description}\n`;
    message += `📍 Ver en Mapa: ${mapsUrl}\n\n`;
  });

  message += `Generado por su Concierge Digital. ¡Disfrute su estancia!`;

  // 2. Usamos la API Nativa de Compartir
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Mis planes en ${hotelName}`,
        text: message,
      });
    } catch (err) {
      console.log("El usuario canceló o hubo un error:", err);
    }
  } else {
    // Fallback para ordenadores que no soportan Share API (abre WhatsApp Web)
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  }
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <div class="flex items-center justify-between no-print">
      <button
        @click="$emit('back')"
        class="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors"
      >
        ← Volver
      </button>
      <h2 class="text-3xl font-serif text-stone-900">Mi Selección</h2>
    </div>

    <div
      id="itinerary-pdf-content"
      class="printable-area bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 border border-stone-100 mx-auto max-w-2xl"
    >
      <div
        class="flex justify-between items-center border-b border-stone-100 pb-6"
      >
        <img
          v-if="hotelData?.logo_url"
          :src="hotelData.logo_url"
          class="h-10 mix-blend-multiply"
        />
        <div class="text-right">
          <p
            class="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-800"
          >
            {{ hotelData?.name }}
          </p>
          <p class="text-[8px] uppercase text-stone-400">Concierge Digital</p>
        </div>
      </div>

      <div class="space-y-10">
        <div
          v-for="(item, idx) in myItinerary"
          :key="idx"
          class="relative pb-6 border-b border-stone-50 last:border-0"
        >
          <button
            @click="$emit('remove', idx)"
            class="absolute -right-2 -top-2 text-rose-300 hover:text-rose-500 no-print p-2 transition-colors"
          >
            ✕
          </button>

          <h5 class="font-serif text-2xl text-stone-800 mb-3 pr-8">
            {{ item.title }}
          </h5>
          <p class="text-stone-500 text-sm leading-relaxed mb-6">
            {{ item.description }}
          </p>

          <div class="flex gap-3 no-print">
            <button
              @click="addToCalendar(item)"
              class="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
            >
              Agendar
            </button>
            <a
              :href="getGoogleMapsUrl(item.title)"
              target="_blank"
              class="px-5 py-3 bg-stone-800 text-white rounded-xl hover:bg-black transition-all flex items-center"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div class="pt-6 text-center">
        <p class="text-[9px] text-stone-400 italic font-serif">
          Gracias por visitarnos
        </p>
      </div>
    </div>

    <div class="max-w-xs mx-auto pt-4 no-print space-y-4">
      <button
        @click="handleShare"
        class="w-full py-6 bg-stone-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Guardar o Compartir Guía
      </button>

      <p
        class="text-[10px] text-stone-400 text-center px-4 leading-relaxed uppercase tracking-tighter"
      >
        Puedes enviarlo por WhatsApp, Email o guardarlo en tus Notas.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* ESTILOS DE IMPRESIÓN MÁGICOS */
@media print {
  /* Oculta todo lo que tenga la clase no-print o no-pdf */
  .no-print,
  .no-pdf {
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
