<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useItineraryStore } from '../stores/useItineraryStore';
import { useHotelStore } from '../stores/useHotelStore';
import { useExternalLinks } from '../composables/useExternalLinks';

const { t: $t } = useI18n();
const router = useRouter();
const itineraryStore = useItineraryStore();
const hotelStore = useHotelStore();
const { addToCalendar, getGoogleMapsUrl } = useExternalLinks();

const myItinerary = computed(() => itineraryStore.myItinerary);
const hotelData = computed(() => hotelStore.hotelData);

// Share via magic link (saves to Firebase) then opens native share or WhatsApp
async function handleMagicShare() {
  const url = await itineraryStore.generateShareLink();
  if (!url) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: $t('summary.share_guide', { city: hotelData.value?.city }),
        url,
      });
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent($t('summary.share_title', { hotel: hotelData.value?.name?.toUpperCase() || '' }) + url)}`, '_blank');
  }
}

// Share as plain text (no Firebase save needed)
async function handleTextShare() {
  const hotelName = hotelData.value?.name || 'hotel';
  let message = $t('summary.share_title', { hotel: hotelName.toUpperCase() });
  myItinerary.value.forEach((item, idx) => {
    message += `${idx + 1}. ${item.title.toUpperCase()}\n${item.description}\n${$t('summary.share_map', { url: getGoogleMapsUrl(item.title) })}\n\n`;
  });

  if (navigator.share) {
    try { await navigator.share({ title: $t('summary.share_guide', { city: hotelData.value?.city }), text: message }); }
    catch (err) { if (err.name !== 'AbortError') console.error(err); }
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500">
    <div class="flex items-center justify-between no-print px-4">
      <button
        @click="router.push('/results')"
        class="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {{ $t('summary.back') }}
      </button>
      <div>
        <h3 class="text-3xl font-serif text-stone-800 tracking-tight">{{ $t('summary.title') }}</h3>
        <p class="text-stone-500 text-sm">{{ $t('summary.subtitle') }}</p>
      </div>
    </div>

    <div class="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl space-y-12 border border-stone-100 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-2 bg-stone-800"></div>

      <div class="flex flex-col items-center text-center gap-4 pb-10 border-b border-stone-100">
        <img v-if="hotelData?.logo_url" :src="hotelData.logo_url" class="h-12 mix-blend-multiply mb-2" />
        <div>
          <h3 class="text-[11px] font-bold uppercase tracking-[0.5em] text-stone-900">{{ hotelData?.name }}</h3>
          <p class="text-stone-400 text-[10px] uppercase tracking-widest mt-1">
            {{ hotelData?.city }} — {{ $t('summary.personal_selection') }}
          </p>
        </div>
      </div>

      <div class="space-y-16">
        <div v-for="(item, idx) in myItinerary" :key="idx" class="relative group">
          <div v-if="item.is_partner" class="mb-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100">
            <p class="text-[10px] text-stone-400 uppercase tracking-widest">{{ $t('results.local_suggestion') }}</p>
          </div>

          <div class="flex justify-between items-start mb-4">
            <h5 class="font-serif text-2xl text-stone-800 leading-tight">{{ item.title }}</h5>
            <button
              @click="itineraryStore.removeFromItinerary(idx)"
              class="text-stone-300 hover:text-rose-400 no-print transition-colors"
              :aria-label="$t('summary.remove')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-stone-500 text-[15px] leading-relaxed mb-8">{{ item.description }}</p>

          <div class="flex flex-col gap-2 no-print">
            <a
              :href="getGoogleMapsUrl(item.title)"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 w-full py-4 bg-stone-800 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ $t('results.see_on_maps') }}
            </a>
            <button
              @click="addToCalendar(item)"
              class="flex items-center justify-center gap-2 w-full py-3 bg-stone-50 text-stone-500 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-stone-100 transition-all"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ $t('summary.calendar') }}
            </button>
          </div>
        </div>
      </div>

      <div class="pt-10 border-t border-stone-50 text-center">
        <p class="text-[10px] text-stone-400 italic font-serif">{{ $t('summary.prepared_for_you') }}</p>
      </div>
    </div>

    <div class="max-w-xs mx-auto pb-12 no-print space-y-3">
      <button
        @click="handleMagicShare()"
        class="w-full py-5 bg-stone-800 text-white rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-stone-900 hover:-translate-y-1"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {{ $t('summary.share') }}
      </button>

      <button
        @click="handleTextShare()"
        class="w-full py-5 bg-white text-stone-600 border border-stone-200 rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-stone-50"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {{ $t('summary.send_whatsapp') }}
      </button>
    </div>
  </div>
</template>
