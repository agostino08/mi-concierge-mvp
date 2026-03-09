<template>
  <div class="min-h-screen bg-stone-50 px-4 py-10">

    <!-- Language toggle (sticky top-right) -->
    <button
      @click="lang = lang === 'en' ? 'es' : 'en'"
      class="fixed top-4 right-4 z-50 text-xs font-bold bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 px-3 py-2 rounded-xl shadow-sm transition-all"
    >
      {{ lang === 'en' ? 'ES' : 'EN' }}
    </button>

    <!-- Success screen -->
    <div v-if="submitted" class="max-w-lg mx-auto text-center pt-20 space-y-6">
      <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-stone-800">{{ T.successTitle }}</h2>
        <p class="text-stone-500 mt-2">{{ T.successBody }}</p>
      </div>
    </div>

    <!-- Form -->
    <div v-else class="max-w-2xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center space-y-2">
        <p class="text-xs font-bold tracking-widest uppercase text-stone-400">Mi Concierge</p>
        <h1 class="text-3xl font-bold text-stone-900">{{ T.pageTitle }}</h1>
        <p class="text-stone-500 text-sm">{{ T.pageSubtitle }}</p>
      </div>

      <!-- Section: Basic Info -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">{{ T.sectionBasic }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="label">{{ T.hotelName }} *</label>
            <input v-model="form.name" type="text" :placeholder="T.phHotelName" class="input" />
          </div>
          <div>
            <label class="label">{{ T.city }} *</label>
            <input v-model="form.city" type="text" :placeholder="T.phCity" class="input" />
          </div>
          <div>
            <label class="label">{{ T.neighborhood }}</label>
            <input v-model="form.neighborhood" type="text" :placeholder="T.phNeighborhood" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">{{ T.address }}</label>
            <input v-model="form.address" type="text" :placeholder="T.phAddress" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">{{ T.mapsUrl }}</label>
            <input v-model="form.maps_url" type="url" placeholder="https://maps.google.com/..." class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">{{ T.description }}</label>
            <textarea v-model="form.description" rows="3" :placeholder="T.phDescription" class="input resize-none"></textarea>
          </div>
        </div>
      </div>

      <!-- Section: Guest Services -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">{{ T.sectionServices }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">{{ T.checkin }}</label>
            <input v-model="form.checkin" type="text" :placeholder="T.phCheckin" class="input" />
          </div>
          <div>
            <label class="label">{{ T.checkout }}</label>
            <input v-model="form.checkout" type="text" :placeholder="T.phCheckout" class="input" />
          </div>
          <div>
            <label class="label">{{ T.reception }}</label>
            <input v-model="form.reception" type="text" :placeholder="T.phReception" class="input" />
          </div>
          <div>
            <label class="label">{{ T.breakfast }}</label>
            <input v-model="form.breakfast" type="text" :placeholder="T.phBreakfast" class="input" />
          </div>
        </div>
      </div>

      <!-- Section: WiFi -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">{{ T.sectionWifi }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">{{ T.wifiName }}</label>
            <input v-model="form.wifi_name" type="text" :placeholder="T.phWifiName" class="input" />
          </div>
          <div>
            <label class="label">{{ T.wifiPass }}</label>
            <input v-model="form.wifi_pass" type="text" :placeholder="T.phWifiPass" class="input" />
          </div>
        </div>
      </div>

      <!-- Section: Facilities -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">{{ T.sectionFacilities }}</h2>
        <p class="text-xs text-stone-400 -mt-2">{{ T.facilitiesHint }}</p>

        <div v-for="f in facilityOptions" :key="f.key" class="space-y-2">
          <label class="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" v-model="form.facilities[f.key].enabled" class="rounded accent-stone-800 w-4 h-4 shrink-0" />
            <span class="text-sm font-semibold text-stone-700 group-hover:text-stone-900">{{ f.label[lang] }}</span>
          </label>
          <div v-if="form.facilities[f.key].enabled" class="ml-7">
            <input
              v-model="form.facilities[f.key].description"
              type="text"
              :placeholder="f.placeholder[lang]"
              class="input text-sm"
            />
          </div>
        </div>

        <div>
          <label class="label">{{ T.facilitiesExtra }}</label>
          <textarea v-model="form.facilities_extra" rows="2" :placeholder="T.phFacilitiesExtra" class="input resize-none"></textarea>
        </div>
      </div>

      <!-- Section: FAQs -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">{{ T.sectionFaqs }}</h2>
          <button
            v-if="form.faqs.length < 8"
            @click="addFaq"
            type="button"
            class="text-xs font-semibold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-all"
          >+ {{ T.addFaq }}</button>
        </div>
        <p class="text-xs text-stone-400">{{ T.faqsHint }}</p>
        <div v-if="form.faqs.length === 0" class="text-center py-6 text-stone-300 text-sm">{{ T.noFaqs }}</div>
        <div v-for="(faq, i) in form.faqs" :key="i" class="space-y-2 border border-stone-100 rounded-xl p-4">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-stone-400">FAQ {{ i + 1 }}</span>
            <button @click="removeFaq(i)" type="button" class="text-xs text-rose-400 hover:text-rose-600">{{ T.remove }}</button>
          </div>
          <input v-model="faq.question" type="text" :placeholder="T.phFaqQuestion" class="input" />
          <textarea v-model="faq.answer" rows="2" :placeholder="T.phFaqAnswer" class="input resize-none"></textarea>
        </div>
      </div>

      <!-- Section: Partner Recommendations -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">{{ T.sectionPartners }}</h2>
          <button
            v-if="form.partners.length < 6"
            @click="addPartner"
            type="button"
            class="text-xs font-semibold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-all"
          >+ {{ T.addPartner }}</button>
        </div>
        <p class="text-xs text-stone-400">{{ T.partnersHint }}</p>
        <div v-if="form.partners.length === 0" class="text-center py-6 text-stone-300 text-sm">{{ T.noPartners }}</div>
        <div v-for="(partner, i) in form.partners" :key="i" class="border border-stone-100 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-stone-400">{{ T.partner }} {{ i + 1 }}</span>
            <button @click="removePartner(i)" type="button" class="text-xs text-rose-400 hover:text-rose-600">{{ T.remove }}</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input v-model="partner.name" type="text" :placeholder="T.phPartnerName" class="input" />
            <select v-model="partner.category" class="input">
              <option value="">{{ T.phPartnerCategory }}</option>
              <option v-for="c in partnerCategories" :key="c">{{ c }}</option>
            </select>
            <input v-model="partner.description" type="text" :placeholder="T.phPartnerDesc" class="sm:col-span-2 input" />
            <input v-model="partner.discount" type="text" :placeholder="T.phPartnerDiscount" class="input" />
            <input v-model="partner.maps_url" type="url" :placeholder="T.phPartnerMaps" class="input" />
          </div>
        </div>
      </div>

      <!-- Section: Contact -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">{{ T.sectionContact }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">{{ T.contactName }} *</label>
            <input v-model="form.contact_name" type="text" :placeholder="T.phContactName" class="input" />
          </div>
          <div>
            <label class="label">{{ T.contactEmail }} *</label>
            <input v-model="form.contact_email" type="email" :placeholder="T.phContactEmail" class="input" />
          </div>
          <div>
            <label class="label">{{ T.contactPhone }}</label>
            <input v-model="form.contact_phone" type="tel" placeholder="+34 612 345 678" class="input" />
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="space-y-3">
        <p v-if="submitError" class="text-rose-600 text-sm font-medium text-center">{{ submitError }}</p>
        <button
          @click="submit"
          :disabled="submitting"
          class="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base hover:bg-stone-700 transition-all active:scale-[0.99] disabled:opacity-60"
        >
          {{ submitting ? T.sending : T.submit }}
        </button>
        <p class="text-center text-xs text-stone-400">{{ T.submitNote }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { submitOnboardingRequest } from '../services/firebase';

const lang = ref('en');
const submitted = ref(false);
const submitting = ref(false);
const submitError = ref('');

// ─── i18n strings ──────────────────────────────────────────────────────────────
const strings = {
  en: {
    pageTitle: 'Hotel Information Form',
    pageSubtitle: 'Fill in as much as you can — we\'ll handle the rest.',
    successTitle: 'Thank you!',
    successBody: 'Your information has been submitted. We\'ll be in touch shortly to set up your Mi Concierge profile.',
    sectionBasic: 'Basic Information',
    hotelName: 'Hotel Name', phHotelName: 'e.g. Hotel Casa Nova',
    city: 'City', phCity: 'e.g. Barcelona',
    neighborhood: 'Neighborhood / District', phNeighborhood: 'e.g. El Born',
    address: 'Street Address', phAddress: 'e.g. Carrer del Rec 15, 08003',
    mapsUrl: 'Google Maps Link',
    description: 'Short Description', phDescription: 'A brief description of your hotel for guests...',
    sectionServices: 'Guest Services',
    checkin: 'Check-in Time', phCheckin: 'e.g. 3:00 PM',
    checkout: 'Check-out Time', phCheckout: 'e.g. 12:00 PM',
    reception: 'Reception Hours', phReception: 'e.g. 24h / 8am–10pm',
    breakfast: 'Breakfast Hours', phBreakfast: 'e.g. 7:00 AM – 10:30 AM',
    sectionWifi: 'WiFi',
    wifiName: 'WiFi Network Name', phWifiName: 'e.g. HotelCasaNova_Guest',
    wifiPass: 'WiFi Password', phWifiPass: 'e.g. Welcome2024',
    sectionFacilities: 'Facilities',
    facilitiesHint: 'Check each facility you have and add details (location, hours, etc.).',
    facilitiesExtra: 'Any other facilities or services?', phFacilitiesExtra: 'e.g. Rooftop terrace, Airport shuttle, Bicycle rental...',
    sectionFaqs: 'Frequently Asked Questions',
    faqsHint: 'Questions your guests frequently ask (optional but recommended).',
    noFaqs: 'No FAQs added yet.',
    addFaq: 'Add FAQ',
    phFaqQuestion: 'Question', phFaqAnswer: 'Answer',
    sectionPartners: 'Partner Recommendations',
    partnersHint: 'Restaurants, bars, shops or tours you want to recommend to guests (optional).',
    noPartners: 'No partners added yet.',
    addPartner: 'Add Partner',
    partner: 'Partner',
    phPartnerName: 'Name', phPartnerCategory: 'Category', phPartnerDesc: 'Short description',
    phPartnerDiscount: 'Guest discount (optional)', phPartnerMaps: 'Google Maps URL (optional)',
    sectionContact: 'Your Contact',
    contactName: 'Your Name', phContactName: 'e.g. Maria García',
    contactEmail: 'Your Email', phContactEmail: 'e.g. maria@hotelcasanova.com',
    contactPhone: 'Your Phone (optional)',
    remove: 'Remove',
    submit: 'Submit Information',
    sending: 'Sending...',
    submitNote: 'We\'ll review your submission and contact you within 24 hours.',
    errName: 'Hotel name is required.',
    errCity: 'City is required.',
    errContactName: 'Your name is required.',
    errContactEmail: 'Your email is required.',
    errFail: 'Failed to submit. Please try again.',
  },
  es: {
    pageTitle: 'Formulario de Información del Hotel',
    pageSubtitle: 'Completa lo que puedas — nosotros nos encargamos del resto.',
    successTitle: '¡Gracias!',
    successBody: 'Tu información ha sido enviada. Nos pondremos en contacto contigo pronto para configurar tu perfil de Mi Concierge.',
    sectionBasic: 'Información Básica',
    hotelName: 'Nombre del Hotel', phHotelName: 'p.ej. Hotel Casa Nova',
    city: 'Ciudad', phCity: 'p.ej. Barcelona',
    neighborhood: 'Barrio / Distrito', phNeighborhood: 'p.ej. El Born',
    address: 'Dirección', phAddress: 'p.ej. Carrer del Rec 15, 08003',
    mapsUrl: 'Enlace de Google Maps',
    description: 'Descripción Breve', phDescription: 'Una breve descripción de tu hotel para los huéspedes...',
    sectionServices: 'Servicios para Huéspedes',
    checkin: 'Hora de Check-in', phCheckin: 'p.ej. 15:00',
    checkout: 'Hora de Check-out', phCheckout: 'p.ej. 12:00',
    reception: 'Horario de Recepción', phReception: 'p.ej. 24h / 8:00–22:00',
    breakfast: 'Horario de Desayuno', phBreakfast: 'p.ej. 7:00 – 10:30',
    sectionWifi: 'WiFi',
    wifiName: 'Nombre de la Red WiFi', phWifiName: 'p.ej. HotelCasaNova_Guest',
    wifiPass: 'Contraseña WiFi', phWifiPass: 'p.ej. Bienvenido2024',
    sectionFacilities: 'Instalaciones',
    facilitiesHint: 'Marca cada instalación disponible y añade detalles (ubicación, horario, etc.).',
    facilitiesExtra: '¿Otras instalaciones o servicios?', phFacilitiesExtra: 'p.ej. Terraza en la azotea, Traslado al aeropuerto, Alquiler de bicicletas...',
    sectionFaqs: 'Preguntas Frecuentes',
    faqsHint: 'Preguntas que tus huéspedes hacen con frecuencia (opcional pero recomendado).',
    noFaqs: 'Aún no hay preguntas frecuentes.',
    addFaq: 'Añadir FAQ',
    phFaqQuestion: 'Pregunta', phFaqAnswer: 'Respuesta',
    sectionPartners: 'Recomendaciones de Partners',
    partnersHint: 'Restaurantes, bares, tiendas o tours que quieras recomendar a los huéspedes (opcional).',
    noPartners: 'Aún no hay partners.',
    addPartner: 'Añadir Partner',
    partner: 'Partner',
    phPartnerName: 'Nombre', phPartnerCategory: 'Categoría', phPartnerDesc: 'Descripción breve',
    phPartnerDiscount: 'Descuento para huéspedes (opcional)', phPartnerMaps: 'URL de Google Maps (opcional)',
    sectionContact: 'Tu Contacto',
    contactName: 'Tu Nombre', phContactName: 'p.ej. María García',
    contactEmail: 'Tu Email', phContactEmail: 'p.ej. maria@hotelcasanova.com',
    contactPhone: 'Tu Teléfono (opcional)',
    remove: 'Eliminar',
    submit: 'Enviar Información',
    sending: 'Enviando...',
    submitNote: 'Revisaremos tu solicitud y nos pondremos en contacto en un plazo de 24 horas.',
    errName: 'El nombre del hotel es obligatorio.',
    errCity: 'La ciudad es obligatoria.',
    errContactName: 'Tu nombre es obligatorio.',
    errContactEmail: 'Tu email es obligatorio.',
    errFail: 'Error al enviar. Por favor, inténtalo de nuevo.',
  },
};

const T = computed(() => strings[lang.value]);

// ─── Facilities config ─────────────────────────────────────────────────────────
const facilityOptions = [
  {
    key: 'pool',
    label: { en: 'Pool', es: 'Piscina' },
    placeholder: { en: 'e.g. Outdoor heated pool – open 8am–10pm, Level 1', es: 'p.ej. Piscina exterior climatizada – abierta 8:00–22:00, Planta 1' },
  },
  {
    key: 'gym',
    label: { en: 'Gym', es: 'Gimnasio' },
    placeholder: { en: 'e.g. Fully equipped gym – open 6am–11pm, Level B1', es: 'p.ej. Gimnasio completo – abierto 6:00–23:00, Planta -1' },
  },
  {
    key: 'spa',
    label: { en: 'Spa', es: 'Spa' },
    placeholder: { en: 'e.g. Spa & wellness centre – by appointment, Level 2', es: 'p.ej. Spa y centro de bienestar – con reserva, Planta 2' },
  },
  {
    key: 'parking',
    label: { en: 'Parking', es: 'Aparcamiento' },
    placeholder: { en: 'e.g. Underground parking – 24h, €20/day, entrance on Calle X', es: 'p.ej. Aparcamiento subterráneo – 24h, 20€/día, entrada por Calle X' },
  },
  {
    key: 'restaurant',
    label: { en: 'Restaurant', es: 'Restaurante' },
    placeholder: { en: 'e.g. Restaurant "La Terraza" – open 1pm–11pm, ground floor', es: 'p.ej. Restaurante "La Terraza" – abierto 13:00–23:00, planta baja' },
  },
  {
    key: 'room_service',
    label: { en: 'Room Service', es: 'Servicio de Habitaciones' },
    placeholder: { en: 'e.g. Available 7am–11pm, dial 0 from your room', es: 'p.ej. Disponible 7:00–23:00, marcar 0 desde la habitación' },
  },
];

const partnerCategories = [
  'Restaurant / Café', 'Bar / Nightlife', 'Shop / Boutique',
  'Tour / Experience', 'Spa / Wellness', 'Transport / Transfer',
  'Museum / Culture', 'Other',
];

// ─── Form state ────────────────────────────────────────────────────────────────
const form = reactive({
  name: '', city: '', neighborhood: '', address: '', maps_url: '', description: '',
  checkin: '', checkout: '', reception: '', breakfast: '',
  wifi_name: '', wifi_pass: '',
  facilities: {
    pool:         { enabled: false, description: '' },
    gym:          { enabled: false, description: '' },
    spa:          { enabled: false, description: '' },
    parking:      { enabled: false, description: '' },
    restaurant:   { enabled: false, description: '' },
    room_service: { enabled: false, description: '' },
  },
  facilities_extra: '',
  faqs: [],
  partners: [],
  contact_name: '', contact_email: '', contact_phone: '',
});

function addFaq()    { form.faqs.push({ question: '', answer: '' }); }
function removeFaq(i) { form.faqs.splice(i, 1); }
function addPartner() { form.partners.push({ name: '', category: '', description: '', discount: '', maps_url: '' }); }
function removePartner(i) { form.partners.splice(i, 1); }

async function submit() {
  submitError.value = '';
  const t = T.value;
  if (!form.name.trim())         { submitError.value = t.errName; return; }
  if (!form.city.trim())         { submitError.value = t.errCity; return; }
  if (!form.contact_name.trim()) { submitError.value = t.errContactName; return; }
  if (!form.contact_email.trim()){ submitError.value = t.errContactEmail; return; }

  submitting.value = true;
  try {
    // Flatten facilities to hotel schema format: key → description text or 'Yes'
    const facilitiesData = {};
    for (const [key, val] of Object.entries(form.facilities)) {
      facilitiesData[key] = val.enabled ? (val.description.trim() || 'Yes') : '';
    }
    if (form.facilities_extra.trim()) facilitiesData.facilities = form.facilities_extra.trim();

    await submitOnboardingRequest({
      name: form.name, city: form.city, neighborhood: form.neighborhood,
      address: form.address, maps_url: form.maps_url, description: form.description,
      checkin: form.checkin, checkout: form.checkout, reception: form.reception, breakfast: form.breakfast,
      wifi_name: form.wifi_name, wifi_pass: form.wifi_pass,
      ...facilitiesData,
      faqs: form.faqs.filter(f => f.question.trim()),
      partners: form.partners.filter(p => p.name.trim()),
      contact_name: form.contact_name, contact_email: form.contact_email, contact_phone: form.contact_phone,
      lang: lang.value,
    });
    submitted.value = true;
  } catch (e) {
    submitError.value = T.value.errFail;
    console.error(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
@reference "tailwindcss";
.input {
  @apply w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-base text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all;
}
.label {
  @apply block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5;
}
</style>
