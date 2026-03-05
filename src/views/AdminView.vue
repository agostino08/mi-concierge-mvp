<script setup>
import { ref, computed, onMounted } from 'vue';
import QRCode from 'qrcode';
import { getAllHotels, createHotel, updateHotel, deleteHotel } from '../services/firebase';

// ─── Auth ─────────────────────────────────────────────────────────────────────
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'admin123';
const isLoggedIn = ref(sessionStorage.getItem('mi_admin') === 'true');
const passcode = ref('');
const loginError = ref('');

function login() {
  if (passcode.value === ADMIN_PASS) {
    sessionStorage.setItem('mi_admin', 'true');
    isLoggedIn.value = true;
    loginError.value = '';
    loadHotels();
  } else {
    loginError.value = 'Incorrect passcode.';
    passcode.value = '';
  }
}

function logout() {
  sessionStorage.removeItem('mi_admin');
  isLoggedIn.value = false;
  screen.value = 'list';
}

// ─── State ────────────────────────────────────────────────────────────────────
const screen = ref('list'); // 'list' | 'form'
const hotels = ref([]);
const selectedId = ref(null);
const saving = ref(false);
const deleting = ref(false);
const listLoading = ref(false);
const saveSuccess = ref(false);
const qrDataUrl = ref('');

const emptyForm = () => ({
  name: '',
  city: '',
  slug: '',
  description: '',
  address: '',
  maps_url: '',
  logo_url: '',
  cover_url: '',
  reception: '',
  checkin: '',
  checkout: '',
  wifi_name: '',
  wifi_pass: '',
  breakfast: '',
  pool: '',
  gym: '',
  spa: '',
  parking: '',
  restaurant: '',
  room_service: '',
  facilities: '',
  faqs: [],
});

const form = ref(emptyForm());

// ─── Computed ─────────────────────────────────────────────────────────────────
const hotelLink = computed(() =>
  selectedId.value ? `${window.location.origin}/?hotel=${selectedId.value}` : ''
);

const isEditing = computed(() => !!selectedId.value);

// ─── Hotel list ───────────────────────────────────────────────────────────────
async function loadHotels() {
  listLoading.value = true;
  try {
    hotels.value = await getAllHotels();
  } catch (e) {
    console.error(e);
  } finally {
    listLoading.value = false;
  }
}

onMounted(() => {
  if (isLoggedIn.value) loadHotels();
});

// ─── Navigation ───────────────────────────────────────────────────────────────
function goList() {
  screen.value = 'list';
  selectedId.value = null;
  form.value = emptyForm();
  qrDataUrl.value = '';
}

function createNew() {
  selectedId.value = null;
  form.value = emptyForm();
  qrDataUrl.value = '';
  screen.value = 'form';
}

async function selectHotel(hotel) {
  selectedId.value = hotel.id;
  form.value = {
    name: hotel.name || '',
    city: hotel.city || '',
    slug: hotel.slug || '',
    description: hotel.description || '',
    address: hotel.address || '',
    maps_url: hotel.maps_url || '',
    logo_url: hotel.logo_url || '',
    cover_url: hotel.cover_url || '',
    reception: hotel.reception || '',
    checkin: hotel.checkin || '',
    checkout: hotel.checkout || '',
    wifi_name: hotel.wifi_name || '',
    wifi_pass: hotel.wifi_pass || '',
    breakfast: hotel.breakfast || '',
    pool: hotel.pool || '',
    gym: hotel.gym || '',
    spa: hotel.spa || '',
    parking: hotel.parking || '',
    restaurant: hotel.restaurant || '',
    room_service: hotel.room_service || '',
    facilities: hotel.facilities || '',
    faqs: hotel.faqs ? JSON.parse(JSON.stringify(hotel.faqs)) : [],
  };
  qrDataUrl.value = '';
  if (hotel.id) {
    const link = `${window.location.origin}/?hotel=${hotel.id}`;
    qrDataUrl.value = await QRCode.toDataURL(link, { margin: 2, width: 200 });
  }
  screen.value = 'form';
}

// ─── Slug helper ──────────────────────────────────────────────────────────────
function generateSlug() {
  form.value.slug = form.value.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ─── Save / Delete ────────────────────────────────────────────────────────────
async function save() {
  saving.value = true;
  saveSuccess.value = false;
  try {
    const data = { ...form.value };
    if (isEditing.value) {
      await updateHotel(selectedId.value, data);
    } else {
      const newId = await createHotel(data);
      selectedId.value = newId;
      const link = `${window.location.origin}/?hotel=${newId}`;
      qrDataUrl.value = await QRCode.toDataURL(link, { margin: 2, width: 200 });
    }
    saveSuccess.value = true;
    await loadHotels();
    setTimeout(() => { saveSuccess.value = false; }, 3000);
  } catch (e) {
    console.error(e);
    alert('Error saving hotel: ' + e.message);
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!confirm(`Delete "${form.value.name}"? This cannot be undone.`)) return;
  deleting.value = true;
  try {
    await deleteHotel(selectedId.value);
    await loadHotels();
    goList();
  } catch (e) {
    console.error(e);
    alert('Error deleting hotel: ' + e.message);
  } finally {
    deleting.value = false;
  }
}

function copyLink() {
  navigator.clipboard.writeText(hotelLink.value).catch(() => {});
}

// ─── FAQ Builder ──────────────────────────────────────────────────────────────
function addFaq() {
  form.value.faqs.push({ id: Date.now().toString(), question: '', answer: '' });
}

function removeFaq(idx) {
  form.value.faqs.splice(idx, 1);
}

// ─── Form field groups ────────────────────────────────────────────────────────
const fieldGroups = [
  {
    title: 'Identity',
    fields: [
      { key: 'name', label: 'Hotel Name', type: 'text', placeholder: 'Grand Hotel Barcelona' },
      { key: 'city', label: 'City', type: 'text', placeholder: 'Barcelona' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'A luxury boutique hotel in the heart of...' },
      { key: 'address', label: 'Address', type: 'text', placeholder: 'Carrer de Provença 123, Barcelona' },
      { key: 'maps_url', label: 'Google Maps URL', type: 'text', placeholder: 'https://maps.google.com/?q=...' },
    ]
  },
  {
    title: 'Branding',
    fields: [
      { key: 'logo_url', label: 'Logo URL', type: 'text', placeholder: 'https://example.com/logo.png' },
      { key: 'cover_url', label: 'Cover Image URL', type: 'text', placeholder: 'https://example.com/cover.jpg' },
      { key: 'slug', label: 'URL Slug', type: 'text', placeholder: 'grand-hotel-barcelona', slugGen: true },
    ]
  },
  {
    title: 'Guest Information',
    fields: [
      { key: 'reception', label: 'Reception Phone', type: 'text', placeholder: '+34 93 000 0000' },
      { key: 'checkin', label: 'Check-in Time', type: 'text', placeholder: '15:00' },
      { key: 'checkout', label: 'Check-out Time', type: 'text', placeholder: '12:00' },
      { key: 'wifi_name', label: 'WiFi Network Name', type: 'text', placeholder: 'GrandHotel_Guest' },
      { key: 'wifi_pass', label: 'WiFi Password', type: 'text', placeholder: 'welcome2024' },
      { key: 'breakfast', label: 'Breakfast Hours', type: 'text', placeholder: '07:00 – 10:30' },
    ]
  },
  {
    title: 'Facilities',
    fields: [
      { key: 'pool', label: 'Pool Info', type: 'text', placeholder: 'Open 08:00–22:00, heated outdoor pool' },
      { key: 'gym', label: 'Gym Info', type: 'text', placeholder: 'Open 06:00–23:00, 4th floor' },
      { key: 'spa', label: 'Spa Info', type: 'text', placeholder: 'Spa & wellness center, appointments required' },
      { key: 'parking', label: 'Parking Info', type: 'text', placeholder: 'Underground parking, €25/night, 24h access' },
      { key: 'restaurant', label: 'Restaurant Info', type: 'text', placeholder: 'La Terraza – open for lunch & dinner' },
      { key: 'room_service', label: 'Room Service', type: 'text', placeholder: 'Available 07:00–23:00, dial extension 0' },
      { key: 'facilities', label: 'Other Facilities', type: 'textarea', placeholder: 'Business centre, concierge desk, laundry service...' },
    ]
  },
];
</script>

<template>
  <div class="min-h-screen bg-stone-50 font-sans text-stone-800">

    <!-- ─── Login screen ───────────────────────────────────────────────── -->
    <div v-if="!isLoggedIn" class="flex items-center justify-center min-h-screen">
      <div class="bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm space-y-6">
        <div class="text-center">
          <div class="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-stone-800">Admin Panel</h1>
          <p class="text-stone-400 text-sm mt-1">Mi Concierge</p>
        </div>

        <div class="space-y-4">
          <input
            v-model="passcode"
            type="password"
            placeholder="Enter passcode"
            @keyup.enter="login"
            class="w-full px-4 py-3 bg-stone-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          <p v-if="loginError" class="text-rose-600 text-xs font-medium">{{ loginError }}</p>
          <button
            @click="login"
            class="w-full py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-700 transition-all active:scale-95"
          >
            Sign In
          </button>
        </div>

        <p class="text-center text-[11px] text-stone-300">
          Set <code class="bg-stone-100 px-1 rounded">VITE_ADMIN_PASS</code> in your environment variables.
        </p>
      </div>
    </div>

    <!-- ─── Main admin UI ─────────────────────────────────────────────── -->
    <template v-else>

      <!-- Top nav -->
      <header class="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-stone-900 rounded-xl flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 class="font-bold text-sm text-stone-800 leading-none">Mi Concierge</h1>
            <p class="text-[10px] text-stone-400 uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="screen === 'form'"
            @click="goList"
            class="text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            All Hotels
          </button>
          <button
            @click="logout"
            class="text-xs font-semibold text-stone-400 hover:text-stone-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div class="max-w-3xl mx-auto px-6 py-8">

        <!-- ── Hotel list ──────────────────────────────────────────────── -->
        <div v-if="screen === 'list'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-stone-800">Hotels
              <span class="text-stone-400 font-normal text-base ml-2">({{ hotels.length }})</span>
            </h2>
            <button
              @click="createNew"
              class="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-700 transition-all active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Hotel
            </button>
          </div>

          <div v-if="listLoading" class="flex justify-center py-12">
            <div class="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin"></div>
          </div>

          <div v-else-if="hotels.length === 0" class="text-center py-16 text-stone-400">
            <p class="text-lg font-medium mb-1">No hotels yet</p>
            <p class="text-sm">Create your first hotel profile to get started.</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="hotel in hotels"
              :key="hotel.id"
              class="bg-white rounded-2xl border border-stone-200 p-5 flex items-center justify-between hover:border-stone-300 transition-all cursor-pointer group"
              @click="selectHotel(hotel)"
            >
              <div class="flex items-center gap-4">
                <img
                  v-if="hotel.logo_url"
                  :src="hotel.logo_url"
                  :alt="hotel.name"
                  class="w-12 h-12 object-contain rounded-xl bg-stone-50 border border-stone-100 p-1"
                />
                <div
                  v-else
                  class="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-xl font-serif"
                >
                  {{ (hotel.name || 'H')[0] }}
                </div>
                <div>
                  <p class="font-semibold text-stone-800 group-hover:text-stone-900">{{ hotel.name }}</p>
                  <p class="text-xs text-stone-400 mt-0.5">{{ hotel.city }}</p>
                </div>
              </div>
              <svg class="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- ── Hotel form ──────────────────────────────────────────────── -->
        <div v-if="screen === 'form'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-stone-800">
              {{ isEditing ? 'Edit Hotel' : 'New Hotel' }}
            </h2>
            <div class="flex gap-3">
              <button
                v-if="isEditing"
                @click="confirmDelete"
                :disabled="deleting"
                class="px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all disabled:opacity-50"
              >
                {{ deleting ? 'Deleting…' : 'Delete' }}
              </button>
              <button
                @click="save"
                :disabled="saving || !form.name"
                class="px-6 py-2 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-700 transition-all disabled:opacity-40 active:scale-95 flex items-center gap-2"
              >
                <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <svg v-else-if="saveSuccess" class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ saving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save' }}
              </button>
            </div>
          </div>

          <!-- Field groups -->
          <div
            v-for="group in fieldGroups"
            :key="group.title"
            class="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          >
            <div class="px-5 py-3 border-b border-stone-100 bg-stone-50">
              <h3 class="text-xs font-bold uppercase tracking-widest text-stone-500">{{ group.title }}</h3>
            </div>
            <div class="p-5 space-y-4">
              <div v-for="field in group.fields" :key="field.key">
                <label class="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">
                  {{ field.label }}
                </label>
                <div class="relative">
                  <textarea
                    v-if="field.type === 'textarea'"
                    v-model="form[field.key]"
                    :placeholder="field.placeholder"
                    rows="2"
                    class="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                  ></textarea>
                  <input
                    v-else
                    v-model="form[field.key]"
                    :type="field.type"
                    :placeholder="field.placeholder"
                    class="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                  <button
                    v-if="field.slugGen"
                    @click="generateSlug"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-md transition-all"
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- FAQ Builder -->
          <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
              <h3 class="text-xs font-bold uppercase tracking-widest text-stone-500">Custom FAQ / Chatbot Pills</h3>
              <button
                @click="addFaq"
                class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500 hover:text-stone-800 transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
            <div class="p-5 space-y-4">
              <p v-if="!form.faqs.length" class="text-sm text-stone-400 text-center py-4">
                No custom FAQs yet. Add one to create chatbot quick-action pills.
              </p>
              <div
                v-for="(faq, idx) in form.faqs"
                :key="faq.id"
                class="border border-stone-200 rounded-xl p-4 space-y-3 relative"
              >
                <button
                  @click="removeFaq(idx)"
                  class="absolute right-3 top-3 text-stone-300 hover:text-rose-500 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <input
                  v-model="faq.question"
                  placeholder="Question (shown as pill button)"
                  class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 pr-8"
                />
                <textarea
                  v-model="faq.answer"
                  placeholder="Answer shown in chat"
                  rows="2"
                  class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Hotel Link & QR Code -->
          <div v-if="isEditing" class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-stone-100 bg-stone-50">
              <h3 class="text-xs font-bold uppercase tracking-widest text-stone-500">Hotel Guest Link</h3>
            </div>
            <div class="p-5 flex flex-col sm:flex-row items-start gap-6">
              <!-- QR Code -->
              <div v-if="qrDataUrl" class="flex-shrink-0">
                <img :src="qrDataUrl" alt="QR Code" class="w-36 h-36 rounded-xl border border-stone-200" />
                <p class="text-[10px] text-stone-400 text-center mt-1">Scan to test</p>
              </div>

              <!-- Link + copy -->
              <div class="flex-1 space-y-3">
                <p class="text-xs text-stone-500 font-medium">Share this URL with your guests (QR code, NFC, or via staff):</p>
                <div class="flex gap-2">
                  <input
                    :value="hotelLink"
                    readonly
                    class="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 focus:outline-none cursor-text select-all"
                  />
                  <button
                    @click="copyLink"
                    class="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200 transition-all active:scale-95"
                  >
                    Copy
                  </button>
                </div>
                <p class="text-[11px] text-stone-400">Hotel ID: <code class="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">{{ selectedId }}</code></p>

                <!-- Logo preview -->
                <div v-if="form.logo_url" class="pt-2">
                  <p class="text-xs text-stone-400 mb-2">Logo preview:</p>
                  <img :src="form.logo_url" :alt="form.name" class="h-10 object-contain" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>
