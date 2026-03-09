<template>
  <div class="min-h-screen bg-stone-50 px-4 py-10">
    <!-- Success screen -->
    <div v-if="submitted" class="max-w-lg mx-auto text-center pt-20 space-y-6">
      <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-stone-800">Thank you!</h2>
        <p class="text-stone-500 mt-2">Your information has been submitted. We'll be in touch shortly to set up your Mi Concierge profile.</p>
      </div>
    </div>

    <!-- Form -->
    <div v-else class="max-w-2xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center space-y-2">
        <p class="text-xs font-bold tracking-widest uppercase text-stone-400">Mi Concierge</p>
        <h1 class="text-3xl font-bold text-stone-900">Hotel Information Form</h1>
        <p class="text-stone-500 text-sm">Fill in as much as you can — we'll handle the rest.</p>
      </div>

      <!-- Section: Basic Info -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">Basic Information</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Hotel Name *</label>
            <input v-model="form.name" type="text" placeholder="e.g. Hotel Casa Nova" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">City *</label>
            <input v-model="form.city" type="text" placeholder="e.g. Barcelona" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Neighborhood / District</label>
            <input v-model="form.neighborhood" type="text" placeholder="e.g. El Born" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Street Address</label>
            <input v-model="form.address" type="text" placeholder="e.g. Carrer del Rec 15, 08003" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Google Maps Link</label>
            <input v-model="form.maps_url" type="url" placeholder="https://maps.google.com/..." class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Short Description</label>
            <textarea v-model="form.description" rows="3" placeholder="A brief description of your hotel for guests..." class="input resize-none"></textarea>
          </div>
        </div>
      </div>

      <!-- Section: Guest Services -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">Guest Services</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Check-in Time</label>
            <input v-model="form.checkin" type="text" placeholder="e.g. 3:00 PM" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Check-out Time</label>
            <input v-model="form.checkout" type="text" placeholder="e.g. 12:00 PM" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Reception Hours</label>
            <input v-model="form.reception" type="text" placeholder="e.g. 24h / 8am–10pm" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Breakfast Hours</label>
            <input v-model="form.breakfast" type="text" placeholder="e.g. 7:00 AM – 10:30 AM" class="input" />
          </div>
        </div>
      </div>

      <!-- Section: WiFi -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">WiFi</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">WiFi Network Name</label>
            <input v-model="form.wifi_name" type="text" placeholder="e.g. HotelCasaNova_Guest" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">WiFi Password</label>
            <input v-model="form.wifi_pass" type="text" placeholder="e.g. Welcome2024" class="input" />
          </div>
        </div>
      </div>

      <!-- Section: Facilities -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">Facilities</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label v-for="f in facilityOptions" :key="f.key" class="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors">
            <input type="checkbox" v-model="form.facilities[f.key]" class="rounded accent-stone-800" />
            <span class="text-sm font-medium text-stone-700">{{ f.label }}</span>
          </label>
        </div>
        <div>
          <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Any other facilities or services?</label>
          <textarea v-model="form.facilities_extra" rows="2" placeholder="e.g. Rooftop terrace, Airport shuttle, Bicycle rental..." class="input resize-none"></textarea>
        </div>
      </div>

      <!-- Section: FAQs -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">Frequently Asked Questions</h2>
          <button
            v-if="form.faqs.length < 8"
            @click="addFaq"
            type="button"
            class="text-xs font-semibold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-all"
          >+ Add FAQ</button>
        </div>
        <p class="text-xs text-stone-400">Questions your guests frequently ask (optional but recommended).</p>
        <div v-if="form.faqs.length === 0" class="text-center py-6 text-stone-300 text-sm">
          No FAQs added yet.
        </div>
        <div v-for="(faq, i) in form.faqs" :key="i" class="space-y-2 border border-stone-100 rounded-xl p-4">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-stone-400">FAQ {{ i + 1 }}</span>
            <button @click="removeFaq(i)" type="button" class="text-xs text-rose-400 hover:text-rose-600">Remove</button>
          </div>
          <input v-model="faq.question" type="text" placeholder="Question" class="input" />
          <textarea v-model="faq.answer" rows="2" placeholder="Answer" class="input resize-none"></textarea>
        </div>
      </div>

      <!-- Section: Partner Recommendations -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">Partner Recommendations</h2>
          <button
            v-if="form.partners.length < 6"
            @click="addPartner"
            type="button"
            class="text-xs font-semibold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-all"
          >+ Add Partner</button>
        </div>
        <p class="text-xs text-stone-400">Restaurants, bars, shops or tours you want to recommend to guests (optional).</p>
        <div v-if="form.partners.length === 0" class="text-center py-6 text-stone-300 text-sm">
          No partners added yet.
        </div>
        <div v-for="(partner, i) in form.partners" :key="i" class="border border-stone-100 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-stone-400">Partner {{ i + 1 }}</span>
            <button @click="removePartner(i)" type="button" class="text-xs text-rose-400 hover:text-rose-600">Remove</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input v-model="partner.name" type="text" placeholder="Name" class="input" />
            <select v-model="partner.category" class="input">
              <option value="">Category</option>
              <option v-for="c in partnerCategories" :key="c">{{ c }}</option>
            </select>
            <input class="sm:col-span-2" v-model="partner.description" type="text" placeholder="Short description" class="input" />
            <input v-model="partner.discount" type="text" placeholder="Guest discount (optional)" class="input" />
            <input v-model="partner.maps_url" type="url" placeholder="Google Maps URL (optional)" class="input" />
          </div>
        </div>
      </div>

      <!-- Section: Contact -->
      <div class="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 class="text-xs font-bold uppercase tracking-widest text-stone-400">Your Contact</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Your Name *</label>
            <input v-model="form.contact_name" type="text" placeholder="e.g. Maria García" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Your Email *</label>
            <input v-model="form.contact_email" type="email" placeholder="e.g. maria@hotelcasanova.com" class="input" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Your Phone (optional)</label>
            <input v-model="form.contact_phone" type="tel" placeholder="e.g. +34 612 345 678" class="input" />
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
          {{ submitting ? 'Sending...' : 'Submit Information' }}
        </button>
        <p class="text-center text-xs text-stone-400">We'll review your submission and contact you within 24 hours.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { submitOnboardingRequest } from '../services/firebase';

const submitted = ref(false);
const submitting = ref(false);
const submitError = ref('');

const facilityOptions = [
  { key: 'pool', label: 'Pool' },
  { key: 'gym', label: 'Gym' },
  { key: 'spa', label: 'Spa' },
  { key: 'parking', label: 'Parking' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'room_service', label: 'Room Service' },
];

const partnerCategories = [
  'Restaurant / Café',
  'Bar / Nightlife',
  'Shop / Boutique',
  'Tour / Experience',
  'Spa / Wellness',
  'Transport / Transfer',
  'Museum / Culture',
  'Other',
];

const form = reactive({
  name: '',
  city: '',
  neighborhood: '',
  address: '',
  maps_url: '',
  description: '',
  checkin: '',
  checkout: '',
  reception: '',
  breakfast: '',
  wifi_name: '',
  wifi_pass: '',
  facilities: { pool: false, gym: false, spa: false, parking: false, restaurant: false, room_service: false },
  facilities_extra: '',
  faqs: [],
  partners: [],
  contact_name: '',
  contact_email: '',
  contact_phone: '',
});

function addFaq() {
  form.faqs.push({ question: '', answer: '' });
}
function removeFaq(i) {
  form.faqs.splice(i, 1);
}
function addPartner() {
  form.partners.push({ name: '', category: '', description: '', discount: '', maps_url: '' });
}
function removePartner(i) {
  form.partners.splice(i, 1);
}

async function submit() {
  submitError.value = '';
  if (!form.name.trim()) { submitError.value = 'Hotel name is required.'; return; }
  if (!form.city.trim()) { submitError.value = 'City is required.'; return; }
  if (!form.contact_name.trim()) { submitError.value = 'Your name is required.'; return; }
  if (!form.contact_email.trim()) { submitError.value = 'Your email is required.'; return; }

  submitting.value = true;
  try {
    // Convert facilities object to individual fields (matching hotel schema)
    const facilitiesData = {};
    for (const [key, val] of Object.entries(form.facilities)) {
      facilitiesData[key] = val ? 'Yes' : '';
    }
    if (form.facilities_extra) facilitiesData.facilities = form.facilities_extra;

    await submitOnboardingRequest({
      ...form,
      ...facilitiesData,
      faqs: form.faqs.filter(f => f.question.trim()),
      partners: form.partners.filter(p => p.name.trim()),
    });
    submitted.value = true;
  } catch (e) {
    submitError.value = 'Failed to submit. Please try again.';
    console.error(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-base text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all;
}
</style>
