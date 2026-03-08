<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import QRCode from 'qrcode';
import { getAllHotels, createHotel, updateHotel, deleteHotel } from '../services/firebase';
import { getHotelAnalytics, getAllAnalytics, computeStats, deleteHotelAnalytics } from '../services/analytics';
import { adminLocale } from '../locales/adminLocale';

// ─── Admin language ────────────────────────────────────────────────────────────
const adminLang = ref(localStorage.getItem('mc_admin_lang') || 'en');
watch(adminLang, (lang) => localStorage.setItem('mc_admin_lang', lang));
const L = computed(() => adminLocale[adminLang.value]);

// ─── Label + topic translation ─────────────────────────────────────────────────
// topicTranslations: AI-translated chatbot topic labels (free-form text, varies per hotel)
const topicTranslations = ref({});
async function translateTopics(topics) {
  if (adminLang.value !== 'es' || !topics?.length) return;
  const untranslated = topics.map(t => t.label).filter(l => !topicTranslations.value[l]);
  if (!untranslated.length) return;
  try {
    const r = await fetch('/api/translate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: untranslated, targetLang: 'es' }),
    });
    if (r.ok) {
      const { translations } = await r.json();
      untranslated.forEach((text, i) => { topicTranslations.value[text] = translations[i]; });
    }
  } catch {}
}

function translateLabel(label) {
  if (adminLang.value !== 'es') return label;
  return topicTranslations.value[label] ?? adminLocale.es.answerLabelMap[label] ?? label;
}

// NOTE: topic watchers are placed after analytics + globalAnalytics declarations (below)

// ─── Send monthly report by email ─────────────────────────────────────────────
const showSendReport = ref(false);
const reportEmailInput = ref('');
const sendingReport = ref(false);
const reportSentOk = ref(false);

async function sendReport() {
  if (!reportEmailInput.value || !analytics.value) return;
  sendingReport.value = true;
  try {
    const res = await fetch('/api/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelName: form.value.name,
        recipientEmail: reportEmailInput.value,
        analytics: analytics.value,
        lang: adminLang.value,
      }),
    });
    if (res.ok) {
      reportSentOk.value = true;
      setTimeout(() => { showSendReport.value = false; reportSentOk.value = false; reportEmailInput.value = ''; }, 2000);
    } else {
      const body = await res.text();
      let msg;
      try {
        const err = JSON.parse(body);
        msg = err.error || 'Email delivery failed.';
      } catch {
        // non-JSON response means the API endpoint is not deployed or reachable
        msg = res.status === 404
          ? 'Email API not found. Make sure the app is deployed to Vercel.'
          : `Server error (${res.status}). Check Vercel logs for details.`;
      }
      alert(msg);
    }
  } catch {
    alert('Network error — please try again.');
  } finally {
    sendingReport.value = false;
  }
}

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
    loginError.value = L.value.incorrectPasscode;
    passcode.value = '';
  }
}

function logout() {
  sessionStorage.removeItem('mi_admin');
  isLoggedIn.value = false;
  screen.value = 'list';
}

// ─── State ────────────────────────────────────────────────────────────────────
const screen = ref('list'); // 'list' | 'form' | 'global'
const hotels = ref([]);
const selectedId = ref(null);
const saving = ref(false);
const deleting = ref(false);
const listLoading = ref(false);
const saveSuccess = ref(false);
const qrDataUrl = ref('');
const analytics = ref(null);
const analyticsLoading = ref(false);

// Partner category VALUES stored in Firestore — always English
const PARTNER_CATEGORIES = [
  'Restaurant / Café',
  'Bar / Nightlife',
  'Shop / Boutique',
  'Tour / Experience',
  'Spa / Wellness',
  'Transport / Transfer',
  'Museum / Culture',
  'Other',
];

const emptyForm = () => ({
  name: '',
  city: '',
  slug: '',
  neighborhood: '',
  hotel_category: '',
  hotel_stars: '',
  description: '',
  ai_context: '',
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
  partners: [],
});

const form = ref(emptyForm());

// ─── Computed ─────────────────────────────────────────────────────────────────
const hotelLink = computed(() => {
  const identifier = form.value.slug || selectedId.value;
  return identifier ? `${window.location.origin}/?hotel=${identifier}` : '';
});

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
  activeFormTab.value = 'profile';
}

function createNew() {
  selectedId.value = null;
  form.value = emptyForm();
  qrDataUrl.value = '';
  activeFormTab.value = 'profile';
  screen.value = 'form';
}

async function selectHotel(hotel) {
  selectedId.value = hotel.id;
  form.value = {
    name: hotel.name || '',
    city: hotel.city || '',
    slug: hotel.slug || '',
    neighborhood: hotel.neighborhood || '',
    hotel_category: hotel.hotel_category || '',
    hotel_stars: hotel.hotel_stars || '',
    description: hotel.description || '',
    ai_context: hotel.ai_context || '',
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
    partners: hotel.partners ? JSON.parse(JSON.stringify(hotel.partners)) : [],
  };
  qrDataUrl.value = '';
  activeFormTab.value = 'profile';
  analytics.value = null;
  if (hotel.id) {
    const qrIdentifier = hotel.slug || hotel.id;
    const link = `${window.location.origin}/?hotel=${qrIdentifier}`;
    qrDataUrl.value = await QRCode.toDataURL(link, { margin: 2, width: 200 });
    analyticsLoading.value = true;
    getHotelAnalytics(hotel.id).then(events => {
      analytics.value = computeStats(events);
    }).catch(() => {}).finally(() => { analyticsLoading.value = false; });
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
      const qrIdentifier = form.value.slug || newId;
      const link = `${window.location.origin}/?hotel=${qrIdentifier}`;
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
    await Promise.all([
      deleteHotel(selectedId.value),
      deleteHotelAnalytics(selectedId.value),
    ]);
    await loadHotels();
    goList();
  } catch (e) {
    console.error(e);
    alert('Error deleting hotel: ' + e.message);
  } finally {
    deleting.value = false;
  }
}

function pct(count, total) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

// ─── Analytics report ─────────────────────────────────────────────────────────
const reportCopied = ref(false);
function copyAnalyticsReport() {
  if (!analytics.value) return;
  const a = analytics.value;
  const loc = L.value;
  const hotelName = form.value.name || 'Hotel';
  const month = new Date().toLocaleDateString(
    adminLang.value === 'es' ? 'es-ES' : 'en-GB',
    { month: 'long', year: 'numeric' },
  );
  const lines = [
    loc.reportTitle(hotelName),
    `${month} · ${loc.reportLast30}`,
    '',
    loc.reportOverview,
    `• ${loc.reportSessions}: ${a.sessions}`,
    `• ${loc.reportItineraries}: ${a.generated}`,
    `• ${loc.reportChatOpens}: ${a.chatOpens}`,
    `• ${loc.reportFavorites}: ${a.favorites}`,
    `• ${loc.reportShares}: ${a.shares}`,
  ];
  if (a.questionnaire?.total > 0) {
    const q = a.questionnaire;
    lines.push('', loc.reportGuestPrefs(q.total));
    if (q.group.length)     lines.push(`• ${loc.reportTravelingAs}: ${q.group.map(i => `${i.label} (${i.count})`).join(', ')}`);
    if (q.budget.length)    lines.push(`• ${loc.reportBudget}: ${q.budget.map(i => `${i.label} (${i.count})`).join(', ')}`);
    if (q.days.length)      lines.push(`• ${loc.reportStay}: ${q.days.map(i => `${i.label} (${i.count})`).join(', ')}`);
    if (q.style.length)     lines.push(`• ${loc.reportStyle}: ${q.style.map(i => i.label).join(', ')}`);
    if (q.food.length)      lines.push(`• ${loc.reportFood}: ${q.food.map(i => i.label).join(', ')}`);
    if (q.transport.length) lines.push(`• ${loc.reportTransport}: ${q.transport.map(i => i.label).join(', ')}`);
  }
  if (a.langs.length) {
    lines.push('', loc.reportLanguages);
    a.langs.forEach(l => lines.push(`• ${l.lang.toUpperCase()}: ${l.pct}%`));
  }
  if (a.topTopics.length) {
    lines.push('', loc.reportTopics);
    a.topTopics.forEach((t, i) => lines.push(`${i + 1}. ${t.label} (${t.count}x)`));
  }
  lines.push('', loc.reportFooter);
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    reportCopied.value = true;
    setTimeout(() => { reportCopied.value = false; }, 2500);
  }).catch(() => {});
}

// ─── Global Insights ──────────────────────────────────────────────────────────
const globalAnalytics = ref(null);
const globalAnalyticsLoading = ref(false);

// ─── Topic translation watchers (must be after analytics + globalAnalytics) ───
watch(() => analytics.value?.topTopics, (t) => { if (t) translateTopics(t); });
watch(() => globalAnalytics.value?.topTopics, (t) => { if (t) translateTopics(t); });
watch(adminLang, () => {
  topicTranslations.value = {};
  if (analytics.value?.topTopics) translateTopics(analytics.value.topTopics);
  if (globalAnalytics.value?.topTopics) translateTopics(globalAnalytics.value.topTopics);
});

async function loadGlobalInsights() {
  screen.value = 'global';
  globalAnalyticsLoading.value = true;
  globalAnalytics.value = null;
  try {
    const events = await getAllAnalytics(30);
    globalAnalytics.value = computeStats(events, hotels.value);
  } catch (e) {
    console.error(e);
  } finally {
    globalAnalyticsLoading.value = false;
  }
}

function copyLink() {
  navigator.clipboard.writeText(hotelLink.value).catch(() => {});
}

function copyKit(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Deployment templates (locale-aware) ──────────────────────────────────────
const emailTemplate = computed(() => {
  const name = form.value.name || '[Hotel Name]';
  const url = hotelLink.value || '[URL]';
  return L.value.emailTpl(name, url);
});

const frontDeskTemplate = computed(() => {
  const name = form.value.name || '[Hotel Name]';
  const url = hotelLink.value || '[URL]';
  return L.value.frontDeskTpl(name, url, form.value.city);
});

const whatsappTemplate = computed(() => {
  const name = form.value.name || '[Hotel Name]';
  const url = hotelLink.value || '[URL]';
  return L.value.whatsappTpl(name, url);
});

// ─── FAQ Builder ──────────────────────────────────────────────────────────────
function addFaq() {
  form.value.faqs.push({ id: Date.now().toString(), pill_text: '', question: '', answer: '' });
}
function removeFaq(idx) {
  form.value.faqs.splice(idx, 1);
}

// ─── Partners Builder ─────────────────────────────────────────────────────────
function addPartner() {
  form.value.partners.push({
    id: Date.now().toString(),
    name: '',
    category: 'Restaurant / Café',
    description: '',
    discount: '',
    maps_url: '',
    website: '',
  });
}
function removePartner(idx) {
  form.value.partners.splice(idx, 1);
}

// ─── Form tabs (locale-aware) ─────────────────────────────────────────────────
const activeFormTab = ref('profile');
const ALL_FORM_TABS_DEF = [
  { key: 'profile',  labelKey: 'tabProfile'  },
  { key: 'info',     labelKey: 'tabInfo'     },
  { key: 'partners', labelKey: 'tabPartners' },
  { key: 'insights', labelKey: 'tabInsights' },
  { key: 'link',     labelKey: 'tabLink'     },
];
const formTabs = computed(() => {
  const loc = L.value;
  return ALL_FORM_TABS_DEF
    .filter(t => {
      if (t.key === 'insights' || t.key === 'link') return isEditing.value;
      return true;
    })
    .map(t => ({ key: t.key, label: loc[t.labelKey] }));
});

// ─── Field groups (locale-aware) ──────────────────────────────────────────────
const fieldGroups = computed(() => {
  const loc = L.value;
  return [
    {
      title: loc.groupIdentity,
      tab: 'profile',
      fields: [
        { key: 'name',           label: loc.labelName,         type: 'text',     placeholder: 'Grand Hotel Barcelona',                                        required: true },
        { key: 'city',           label: loc.labelCity,         type: 'text',     placeholder: 'Barcelona' },
        { key: 'neighborhood',   label: loc.labelNeighborhood, type: 'text',     placeholder: 'Eixample, Gràcia, Gothic Quarter...' },
        { key: 'hotel_category', label: loc.labelCategory,     type: 'select',   options: loc.catOptions },
        { key: 'hotel_stars',    label: loc.labelStars,        type: 'select',   options: loc.starOptions },
        { key: 'description',    label: loc.labelDescription,  type: 'textarea', placeholder: 'A luxury boutique hotel in the heart of the city...' },
        { key: 'ai_context',     label: loc.labelAiContext,    type: 'textarea', placeholder: 'Typical guest profile, what makes this hotel unique, nearby landmarks, local secrets, areas to avoid, best neighbourhoods for dining, insider tips for this city...' },
        { key: 'address',        label: loc.labelAddress,      type: 'text',     placeholder: 'Carrer de Provença 123, Barcelona' },
        { key: 'maps_url',       label: loc.labelMapsUrl,      type: 'text',     placeholder: 'https://maps.google.com/?q=...' },
      ],
    },
    {
      title: loc.groupBranding,
      tab: 'profile',
      fields: [
        { key: 'logo_url',  label: loc.labelLogoUrl,  type: 'text', placeholder: 'https://cdn.example.com/logo.png' },
        { key: 'cover_url', label: loc.labelCoverUrl, type: 'text', placeholder: 'https://cdn.example.com/cover.jpg' },
        { key: 'slug',      label: loc.labelSlug,     type: 'text', placeholder: 'grand-hotel-barcelona', slugGen: true },
      ],
    },
    {
      title: loc.groupGuestInfo,
      tab: 'info',
      fields: [
        { key: 'reception',  label: loc.labelReception, type: 'text', placeholder: '+34 93 000 0000' },
        { key: 'checkin',    label: loc.labelCheckin,   type: 'time', hint: loc.hintCheckin },
        { key: 'checkout',   label: loc.labelCheckout,  type: 'time', hint: loc.hintCheckout },
        { key: 'wifi_name',  label: loc.labelWifiName,  type: 'text', placeholder: 'GrandHotel_Guest' },
        { key: 'wifi_pass',  label: loc.labelWifiPass,  type: 'text', placeholder: 'welcome2024' },
        { key: 'breakfast',  label: loc.labelBreakfast, type: 'text', placeholder: '07:30 – 10:30 · Main restaurant, 2nd floor' },
      ],
    },
    {
      title: loc.groupFacilities,
      tab: 'info',
      fields: [
        { key: 'pool',         label: loc.labelPool,        type: 'text',     placeholder: 'Open daily 08:00–22:00 · Heated outdoor pool on rooftop' },
        { key: 'gym',          label: loc.labelGym,         type: 'text',     placeholder: 'Open 06:00–23:00 · 4th floor, free for guests' },
        { key: 'spa',          label: loc.labelSpa,         type: 'text',     placeholder: 'Treatments 10:00–20:00 · Advance booking required' },
        { key: 'parking',      label: loc.labelParking,     type: 'text',     placeholder: 'Underground parking, €25/night, 24h access, dial ext. 8' },
        { key: 'restaurant',   label: loc.labelRestaurant,  type: 'text',     placeholder: 'La Terraza · Lunch 13:00–15:30 · Dinner 19:00–23:00' },
        { key: 'room_service', label: loc.labelRoomService, type: 'text',     placeholder: 'Available 07:00–23:00 · Call extension 0' },
        { key: 'facilities',   label: loc.labelFacilities,  type: 'textarea', placeholder: 'Business centre 24h · Concierge desk · Luggage storage · Laundry service...' },
      ],
    },
  ];
});
</script>

<template>
  <div class="min-h-screen bg-stone-50 font-sans text-stone-800">

    <!-- ─── Send Report Modal ──────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showSendReport" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="showSendReport = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
          <div>
            <h3 class="text-base font-bold text-stone-800">{{ L.sendReport }}</h3>
            <p class="text-sm text-stone-400 mt-1">{{ L.sendReportDesc }}</p>
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-stone-500">{{ L.recipientEmailLabel }}</label>
            <input
              v-model="reportEmailInput"
              type="email"
              :placeholder="adminLang === 'es' ? 'hotel@ejemplo.com' : 'hotel@example.com'"
              class="w-full border border-stone-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-stone-400"
              @keydown.enter="sendReport"
            />
          </div>
          <div class="flex gap-2 pt-1">
            <button @click="showSendReport = false" class="flex-1 py-3 rounded-xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 transition-all">
              {{ L.cancel }}
            </button>
            <button
              @click="sendReport"
              :disabled="sendingReport || !reportEmailInput"
              class="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              :class="reportSentOk ? 'bg-emerald-500 text-white' : 'bg-stone-800 text-white hover:bg-black'"
            >
              {{ reportSentOk ? L.reportSentOk : sendingReport ? L.sendingReport : L.sendReportBtn }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── Login screen ───────────────────────────────────────────────── -->
    <div v-if="!isLoggedIn" class="flex items-center justify-center min-h-screen px-4">
      <div class="bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm space-y-6">
        <div class="text-center">
          <div class="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-stone-800">{{ L.adminPanel }}</h1>
          <p class="text-stone-400 text-sm mt-1">Mi Concierge</p>
        </div>

        <div class="space-y-4">
          <input
            v-model="passcode"
            type="password"
            :placeholder="L.enterPasscode"
            @keyup.enter="login"
            class="w-full px-4 py-3.5 bg-stone-100 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          <p v-if="loginError" class="text-rose-600 text-sm font-medium">{{ loginError }}</p>
          <button
            @click="login"
            class="w-full py-3.5 bg-stone-900 text-white rounded-xl font-semibold text-base hover:bg-stone-700 transition-all active:scale-95"
          >
            {{ L.signIn }}
          </button>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-[11px] text-stone-300">
            Set <code class="bg-stone-100 px-1 rounded">VITE_ADMIN_PASS</code> in env vars.
          </p>
          <button
            @click="adminLang = adminLang === 'en' ? 'es' : 'en'"
            class="text-[11px] font-bold text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg transition-all font-mono"
          >
            {{ adminLang === 'en' ? 'ES' : 'EN' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Main admin UI ─────────────────────────────────────────────── -->
    <template v-else>

      <!-- Top nav -->
      <header class="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center">
            <svg class="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px;height:18px">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-bold text-sm text-stone-800 leading-none">Mi Concierge</h1>
              <span class="text-stone-300 text-sm leading-none">/</span>
              <span class="text-xs text-stone-500 font-medium leading-none">{{ L.admin }}</span>
              <span v-if="screen === 'form'" class="text-stone-300 text-sm leading-none">/</span>
              <span v-if="screen === 'form'" class="text-xs text-stone-500 font-medium leading-none truncate max-w-[120px]">
                {{ form.name || L.newHotel }}
              </span>
              <span v-if="screen === 'global'" class="text-stone-300 text-sm leading-none">/</span>
              <span v-if="screen === 'global'" class="text-xs text-stone-500 font-medium leading-none">{{ L.globalTitle }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Language toggle -->
          <button
            @click="adminLang = adminLang === 'en' ? 'es' : 'en'"
            class="text-[11px] font-bold text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg transition-all font-mono"
          >
            {{ adminLang === 'en' ? 'ES' : 'EN' }}
          </button>
          <button
            v-if="screen === 'form' || screen === 'global'"
            @click="goList"
            class="text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-100"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            {{ L.allHotels }}
          </button>
          <button
            @click="logout"
            class="text-xs font-semibold text-stone-400 hover:text-stone-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100"
          >
            {{ L.signOut }}
          </button>
        </div>
      </header>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        <!-- ── Hotel list ──────────────────────────────────────────────── -->
        <div v-if="screen === 'list'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-stone-800">{{ L.hotels }}</h2>
              <p class="text-sm text-stone-400 mt-0.5">{{ L.hotelsCount(hotels.length) }}</p>
            </div>
            <button
              @click="loadGlobalInsights"
              class="flex items-center gap-2 px-4 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-100 transition-all active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {{ L.globalInsights }}
            </button>
            <button
              @click="createNew"
              class="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-700 transition-all active:scale-95"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ L.newHotel }}
            </button>
          </div>

          <div v-if="listLoading" class="flex justify-center py-16">
            <div class="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin"></div>
          </div>

          <div v-else-if="hotels.length === 0" class="text-center py-20 bg-white rounded-2xl border border-stone-200">
            <div class="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p class="font-semibold text-stone-600 mb-1">{{ L.noHotelsYet }}</p>
            <p class="text-sm text-stone-400">{{ L.noHotelsDesc }}</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="hotel in hotels"
              :key="hotel.id"
              class="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between hover:border-stone-300 hover:shadow-sm transition-all cursor-pointer group"
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
                  class="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 border border-stone-200 flex items-center justify-center text-stone-500 text-xl font-serif font-bold"
                >
                  {{ (hotel.name || 'H')[0] }}
                </div>
                <div>
                  <p class="font-semibold text-stone-800 text-base">{{ hotel.name }}</p>
                  <p class="text-sm text-stone-400 mt-0.5">{{ hotel.city }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="hidden sm:block text-[10px] font-mono text-stone-300">{{ hotel.id?.slice(0, 8) }}…</span>
                <svg class="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>


        <!-- ── Global Insights ─────────────────────────────────── -->
        <div v-if="screen === 'global'" class="space-y-6">
          <div>
            <h2 class="text-xl font-bold text-stone-800">{{ L.globalTitle }}</h2>
            <p class="text-sm text-stone-400 mt-0.5">{{ L.globalSubtitle }}</p>
          </div>
          <div v-if="globalAnalyticsLoading" class="flex justify-center py-16">
            <div class="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin"></div>
          </div>
          <div v-else-if="!globalAnalytics" class="text-center py-16">
            <p class="text-stone-400 text-sm">{{ L.noData }}</p>
          </div>
          <template v-else>
            <!-- Key metrics -->
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <div class="bg-white rounded-2xl border border-stone-200 p-3.5 text-center">
                <p class="text-2xl font-bold text-stone-800">{{ globalAnalytics.sessions }}</p>
                <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.sessions }}</p>
              </div>
              <div class="bg-white rounded-2xl border border-stone-200 p-3.5 text-center">
                <p class="text-2xl font-bold text-stone-800">{{ globalAnalytics.generated }}</p>
                <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.itineraries }}</p>
              </div>
              <div class="bg-white rounded-2xl border border-stone-200 p-3.5 text-center">
                <p class="text-2xl font-bold text-stone-800">{{ globalAnalytics.chatOpens }}</p>
                <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.chatOpens }}</p>
              </div>
              <div class="bg-white rounded-2xl border border-stone-200 p-3.5 text-center">
                <p class="text-2xl font-bold text-stone-800">{{ globalAnalytics.favorites }}</p>
                <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.favorites }}</p>
              </div>
              <div class="bg-white rounded-2xl border border-stone-200 p-3.5 text-center">
                <p class="text-2xl font-bold text-stone-800">{{ globalAnalytics.shares }}</p>
                <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.shares }}</p>
              </div>
            </div>
            <!-- Conversion funnel -->
            <div class="bg-white rounded-2xl border border-stone-200 p-5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">{{ L.conversionFunnel }}</p>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <span class="text-xs text-stone-600 w-44 shrink-0">{{ L.sessions }}</span>
                  <div class="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden"><div class="h-full bg-stone-700 rounded-full" style="width:100%"></div></div>
                  <span class="text-xs font-semibold text-stone-600 w-10 text-right shrink-0">{{ globalAnalytics.sessions }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-stone-600 w-44 shrink-0">{{ L.questionnairesRow }}</span>
                  <div class="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden"><div class="h-full bg-stone-500 rounded-full transition-all" :style="{ width: pct(globalAnalytics.questionnaire.total, globalAnalytics.sessions) + '%' }"></div></div>
                  <span class="text-xs font-semibold text-stone-600 w-10 text-right shrink-0">{{ globalAnalytics.questionnaire.total }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-stone-600 w-44 shrink-0">{{ L.itinerariesGenerated }}</span>
                  <div class="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden"><div class="h-full bg-amber-400 rounded-full transition-all" :style="{ width: pct(globalAnalytics.generated, globalAnalytics.sessions) + '%' }"></div></div>
                  <span class="text-xs font-semibold text-stone-600 w-10 text-right shrink-0">{{ globalAnalytics.generated }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-stone-600 w-44 shrink-0">{{ L.sharedItineraries }}</span>
                  <div class="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden"><div class="h-full bg-emerald-400 rounded-full transition-all" :style="{ width: pct(globalAnalytics.shares, globalAnalytics.sessions) + '%' }"></div></div>
                  <span class="text-xs font-semibold text-stone-600 w-10 text-right shrink-0">{{ globalAnalytics.shares }}</span>
                </div>
              </div>
            </div>
            <!-- Top hotels -->
            <div v-if="globalAnalytics.hotelBreakdown.length" class="bg-white rounded-2xl border border-stone-200 p-5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">{{ L.topHotels }}</p>
              <div class="space-y-2">
                <div v-for="(hotel, idx) in globalAnalytics.hotelBreakdown" :key="hotel.hotelId" class="flex items-center gap-3">
                  <span class="text-[10px] font-bold text-stone-300 w-4 shrink-0">{{ idx + 1 }}</span>
                  <span class="text-xs text-stone-600 w-36 shrink-0 truncate">{{ hotel.name }}</span>
                  <div class="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden"><div class="h-full bg-stone-700 rounded-full transition-all" :style="{ width: pct(hotel.count, globalAnalytics.hotelBreakdown[0].count) + '%' }"></div></div>
                  <span class="text-[11px] font-semibold text-stone-400 w-8 text-right shrink-0">{{ hotel.count }}</span>
                </div>
              </div>
            </div>
            <!-- Guest preferences grid -->
            <div v-if="globalAnalytics.questionnaire.total > 0" class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div class="px-5 py-3.5 border-b border-stone-100 bg-stone-50/80">
                <h3 class="text-xs font-bold uppercase tracking-widest text-stone-500">{{ L.guestPrefs }}</h3>
                <p class="text-[11px] text-stone-400 mt-0.5">{{ L.acrossAllHotels(globalAnalytics.questionnaire.total) }}</p>
              </div>
              <div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-if="globalAnalytics.questionnaire.group.length" class="bg-stone-50 rounded-xl p-4">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.travelingAs }}</p>
                  <div class="space-y-3">
                    <div v-for="item in globalAnalytics.questionnaire.group" :key="item.label" class="space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                        <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                      </div>
                      <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden"><div class="h-full bg-amber-400 rounded-full transition-all" :style="{ width: pct(item.count, globalAnalytics.questionnaire.total) + '%' }"></div></div>
                    </div>
                  </div>
                </div>
                <div v-if="globalAnalytics.questionnaire.budget.length" class="bg-stone-50 rounded-xl p-4">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.budget }}</p>
                  <div class="space-y-3">
                    <div v-for="item in globalAnalytics.questionnaire.budget" :key="item.label" class="space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                        <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                      </div>
                      <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden"><div class="h-full bg-stone-500 rounded-full transition-all" :style="{ width: pct(item.count, globalAnalytics.questionnaire.total) + '%' }"></div></div>
                    </div>
                  </div>
                </div>
                <div v-if="globalAnalytics.questionnaire.days.length" class="bg-stone-50 rounded-xl p-4">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.lengthOfStay }}</p>
                  <div class="space-y-3">
                    <div v-for="item in globalAnalytics.questionnaire.days" :key="item.label" class="space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                        <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                      </div>
                      <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden"><div class="h-full bg-stone-500 rounded-full transition-all" :style="{ width: pct(item.count, globalAnalytics.questionnaire.total) + '%' }"></div></div>
                    </div>
                  </div>
                </div>
                <div v-if="globalAnalytics.questionnaire.style.length" class="bg-stone-50 rounded-xl p-4">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.travelStyle }}</p>
                  <div class="space-y-3">
                    <div v-for="item in globalAnalytics.questionnaire.style" :key="item.label" class="space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                        <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                      </div>
                      <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden"><div class="h-full bg-amber-400 rounded-full transition-all" :style="{ width: pct(item.count, globalAnalytics.questionnaire.styleTotal) + '%' }"></div></div>
                    </div>
                  </div>
                </div>
                <div v-if="globalAnalytics.questionnaire.food.length" class="bg-stone-50 rounded-xl p-4">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.foodPrefs }}</p>
                  <div class="space-y-3">
                    <div v-for="item in globalAnalytics.questionnaire.food" :key="item.label" class="space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                        <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                      </div>
                      <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden"><div class="h-full bg-stone-500 rounded-full transition-all" :style="{ width: pct(item.count, globalAnalytics.questionnaire.foodTotal) + '%' }"></div></div>
                    </div>
                  </div>
                </div>
                <div v-if="globalAnalytics.questionnaire.transport.length" class="bg-stone-50 rounded-xl p-4">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.transport }}</p>
                  <div class="space-y-3">
                    <div v-for="item in globalAnalytics.questionnaire.transport" :key="item.label" class="space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                        <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                      </div>
                      <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden"><div class="h-full bg-stone-500 rounded-full transition-all" :style="{ width: pct(item.count, globalAnalytics.questionnaire.transportTotal) + '%' }"></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Top chatbot topics -->
            <div v-if="globalAnalytics.topTopics.length" class="bg-white rounded-2xl border border-stone-200 p-5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.topTopics }}</p>
              <div class="space-y-3">
                <div v-for="(topic, idx) in globalAnalytics.topTopics" :key="topic.label" class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="text-[11px] font-bold text-stone-300 w-4 shrink-0">{{ idx + 1 }}</span>
                    <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(topic.label) }}</span>
                  </div>
                  <span class="text-sm font-bold text-amber-600 shrink-0">{{ topic.count }}×</span>
                </div>
              </div>
            </div>
            <!-- Languages -->
            <div v-if="globalAnalytics.langs.length" class="bg-white rounded-2xl border border-stone-200 p-5">
              <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.languages }}</p>
              <div class="space-y-3">
                <div v-for="lang in globalAnalytics.langs" :key="lang.lang" class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-bold uppercase text-stone-600">{{ lang.lang }}</span>
                    <span class="text-sm text-stone-400">{{ lang.pct }}%</span>
                  </div>
                  <div class="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden"><div class="h-full bg-stone-600 rounded-full transition-all" :style="{ width: lang.pct + '%' }"></div></div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ── Hotel form ──────────────────────────────────────────────── -->
        <div v-if="screen === 'form'" class="space-y-5">

          <!-- Form header with actions -->
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-stone-800">
              {{ isEditing ? L.editHotel : L.newHotel }}
            </h2>
            <div class="flex gap-2">
              <button
                v-if="isEditing"
                @click="confirmDelete"
                :disabled="deleting"
                class="px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all disabled:opacity-50"
              >
                {{ deleting ? L.deleting : L.delete }}
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
                {{ saving ? L.saving : saveSuccess ? L.saved : L.save }}
              </button>
            </div>
          </div>

          <!-- Tab navigation -->
          <div class="flex p-1 bg-stone-200/50 rounded-2xl sticky top-14 z-30 backdrop-blur-md border border-white">
            <button
              v-for="tab in formTabs"
              :key="tab.key"
              @click="activeFormTab = tab.key"
              :class="activeFormTab === tab.key ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'"
              class="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Field groups rendered only for the active tab -->
          <template v-for="group in fieldGroups" :key="group.title">
          <div
            v-if="activeFormTab === group.tab"
            class="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          >
            <div class="px-5 py-3.5 border-b border-stone-100 bg-stone-50/80">
              <h3 class="text-xs font-bold uppercase tracking-widest text-stone-500">{{ group.title }}</h3>
            </div>
            <div class="p-5 space-y-5">
              <div v-for="field in group.fields" :key="field.key">
                <label class="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">
                  {{ field.label }}
                  <span v-if="field.required" class="text-rose-400 ml-0.5">*</span>
                </label>
                <div class="relative">
                  <textarea
                    v-if="field.type === 'textarea'"
                    v-model="form[field.key]"
                    :placeholder="field.placeholder"
                    rows="2"
                    class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none transition-all"
                  ></textarea>
                  <select
                    v-else-if="field.type === 'select'"
                    v-model="form[field.key]"
                    class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all appearance-none"
                  >
                    <option value="">{{ L.selectOption }}</option>
                    <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <input
                    v-else
                    v-model="form[field.key]"
                    :type="field.type"
                    :placeholder="field.placeholder || ''"
                    class="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
                    :class="{ 'pr-16': field.slugGen }"
                  />
                  <button
                    v-if="field.slugGen"
                    @click="generateSlug"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-md transition-all"
                  >
                    {{ L.auto }}
                  </button>
                </div>
                <p v-if="field.hint" class="text-[11px] text-stone-400 mt-1.5">{{ field.hint }}</p>
              </div>
            </div>
          </div>
          </template>

          <!-- ── FAQ Builder ──────────────────────────────────────────── -->
          <div v-if="activeFormTab === 'info'" class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div class="px-5 py-3.5 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-widest text-stone-500">{{ L.customFaqs }}</h3>
                <p class="text-[11px] text-stone-400 mt-0.5">{{ L.faqsDesc }}</p>
              </div>
              <button
                @click="addFaq"
                class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                {{ L.addFaq }}
              </button>
            </div>
            <div class="p-5 space-y-4">
              <p v-if="!form.faqs.length" class="text-sm text-stone-400 text-center py-6">
                {{ L.noFaqs }}
              </p>
              <div
                v-for="(faq, idx) in form.faqs"
                :key="faq.id"
                class="border border-stone-200 rounded-xl p-4 space-y-3 relative group"
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
                  v-model="faq.pill_text"
                  :placeholder="L.pillPh"
                  class="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-amber-300 pr-8"
                />
                <input
                  v-model="faq.question"
                  :placeholder="L.questionPh"
                  class="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-stone-300 pr-8"
                />
                <textarea
                  v-model="faq.answer"
                  :placeholder="L.answerPh"
                  rows="2"
                  class="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- ── Partners Builder ─────────────────────────────────────── -->
          <div v-if="activeFormTab === 'partners'" class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div class="px-5 py-3.5 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-widest text-stone-500">{{ L.partnersTitle }}</h3>
                <p class="text-[11px] text-stone-400 mt-0.5">{{ L.partnersDesc }}</p>
              </div>
              <button
                @click="addPartner"
                class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                {{ L.addPartner }}
              </button>
            </div>
            <div class="p-5 space-y-4">
              <p v-if="!form.partners.length" class="text-sm text-stone-400 text-center py-6">
                {{ L.noPartners }}
              </p>
              <div
                v-for="(partner, idx) in form.partners"
                :key="partner.id"
                class="border border-stone-200 rounded-xl p-4 space-y-3 relative"
              >
                <button
                  @click="removePartner(idx)"
                  class="absolute right-3 top-3 text-stone-300 hover:text-rose-500 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div class="grid grid-cols-2 gap-3 pr-6">
                  <input
                    v-model="partner.name"
                    :placeholder="L.partnerNamePh"
                    class="col-span-2 sm:col-span-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                  <select
                    v-model="partner.category"
                    class="col-span-2 sm:col-span-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-stone-300"
                  >
                    <option
                      v-for="(cat, idx) in PARTNER_CATEGORIES"
                      :key="cat"
                      :value="cat"
                    >{{ L.partnerCatDisplay[idx] }}</option>
                  </select>
                </div>
                <textarea
                  v-model="partner.description"
                  :placeholder="L.partnerDescPh"
                  rows="2"
                  class="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
                ></textarea>
                <input
                  v-model="partner.discount"
                  :placeholder="L.guestPerkPh"
                  class="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    v-model="partner.maps_url"
                    :placeholder="L.mapsUrlPh"
                    class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                  <input
                    v-model="partner.website"
                    :placeholder="L.websitePh"
                    class="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- ── Insights (Analytics) ──────────────────────────────── -->
          <div v-if="isEditing && activeFormTab === 'insights'" class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div class="px-5 py-3.5 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-widests text-stone-500">{{ L.insightsTitle }}</h3>
                <p class="text-[11px] text-stone-400 mt-0.5">{{ L.insightsDesc }}</p>
              </div>
              <div class="flex items-center gap-2">
                <template v-if="analytics && !analyticsLoading">
                  <button
                    @click="copyAnalyticsReport"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-lg transition-all"
                    :class="reportCopied ? 'text-emerald-600 bg-emerald-50' : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200'"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {{ reportCopied ? L.copied : L.copyReport }}
                  </button>
                  <button
                    @click="showSendReport = true"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded-lg bg-stone-800 text-white hover:bg-black transition-all"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {{ L.sendReport }}
                  </button>
                </template>
                <span v-if="analyticsLoading" class="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {{ L.loading }}
                </span>
              </div>
            </div>
            <div class="p-5">
              <div v-if="analyticsLoading && !analytics" class="grid grid-cols-3 gap-3">
                <div v-for="i in 3" :key="i" class="bg-stone-50 rounded-xl h-16 animate-pulse"></div>
              </div>
              <div v-else-if="!analytics || (analytics.sessions === 0 && analytics.generated === 0)" class="text-center py-8">
                <p class="text-stone-400 text-sm">{{ L.noActivity }}</p>
                <p class="text-stone-300 text-[11px] mt-1">{{ L.noActivityDesc }}</p>
              </div>
              <div v-else class="space-y-6">
                <!-- Key metrics -->
                <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  <div class="bg-stone-50 rounded-xl p-3.5 text-center">
                    <p class="text-2xl font-bold text-stone-800">{{ analytics.sessions }}</p>
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.sessions }}</p>
                  </div>
                  <div class="bg-stone-50 rounded-xl p-3.5 text-center">
                    <p class="text-2xl font-bold text-stone-800">{{ analytics.generated }}</p>
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.itineraries }}</p>
                  </div>
                  <div class="bg-stone-50 rounded-xl p-3.5 text-center">
                    <p class="text-2xl font-bold text-stone-800">{{ analytics.chatOpens }}</p>
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.chatOpens }}</p>
                  </div>
                  <div class="bg-stone-50 rounded-xl p-3.5 text-center">
                    <p class="text-2xl font-bold text-stone-800">{{ analytics.favorites }}</p>
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.favorites }}</p>
                  </div>
                  <div class="bg-stone-50 rounded-xl p-3.5 text-center">
                    <p class="text-2xl font-bold text-stone-800">{{ analytics.shares }}</p>
                    <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mt-0.5">{{ L.shares }}</p>
                  </div>
                </div>
                <!-- Chatbot topics -->
                <div v-if="analytics.topTopics.length" class="bg-stone-50 rounded-xl p-5">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.topTopics }}</p>
                  <div class="space-y-3">
                    <div v-for="(topic, idx) in analytics.topTopics" :key="topic.label" class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <span class="text-[11px] font-bold text-stone-300 w-4 shrink-0">{{ idx + 1 }}</span>
                        <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(topic.label) }}</span>
                      </div>
                      <span class="text-sm font-bold text-amber-600 shrink-0">{{ topic.count }}×</span>
                    </div>
                  </div>
                </div>
                <!-- Languages -->
                <div v-if="analytics.langs.length" class="bg-stone-50 rounded-xl p-5">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.languages }}</p>
                  <div class="space-y-3">
                    <div v-for="lang in analytics.langs" :key="lang.lang" class="space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-bold uppercase text-stone-600">{{ lang.lang }}</span>
                        <span class="text-sm text-stone-400">{{ lang.pct }}%</span>
                      </div>
                      <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                        <div class="h-full bg-stone-600 rounded-full transition-all" :style="{ width: lang.pct + '%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Guest preferences grid -->
                <div v-if="analytics.questionnaire && analytics.questionnaire.total > 0">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">
                    {{ L.guestPrefs }} <span class="text-stone-300 font-normal normal-case tracking-normal ml-1">· {{ analytics.questionnaire.total }} {{ L.questionnaires }}</span>
                  </p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-if="analytics.questionnaire.group.length" class="bg-stone-50 rounded-xl p-4">
                      <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.travelingAs }}</p>
                      <div class="space-y-3">
                        <div v-for="item in analytics.questionnaire.group" :key="item.label" class="space-y-1">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                            <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                          </div>
                          <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                            <div class="h-full bg-amber-400 rounded-full transition-all" :style="{ width: pct(item.count, analytics.questionnaire.total) + '%' }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="analytics.questionnaire.budget.length" class="bg-stone-50 rounded-xl p-4">
                      <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.budget }}</p>
                      <div class="space-y-3">
                        <div v-for="item in analytics.questionnaire.budget" :key="item.label" class="space-y-1">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                            <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                          </div>
                          <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                            <div class="h-full bg-stone-500 rounded-full transition-all" :style="{ width: pct(item.count, analytics.questionnaire.total) + '%' }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="analytics.questionnaire.days.length" class="bg-stone-50 rounded-xl p-4">
                      <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.lengthOfStay }}</p>
                      <div class="space-y-3">
                        <div v-for="item in analytics.questionnaire.days" :key="item.label" class="space-y-1">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                            <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                          </div>
                          <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                            <div class="h-full bg-stone-500 rounded-full transition-all" :style="{ width: pct(item.count, analytics.questionnaire.total) + '%' }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="analytics.questionnaire.style.length" class="bg-stone-50 rounded-xl p-4">
                      <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.travelStyle }} <span class="text-stone-300 font-normal normal-case">{{ L.top5 }}</span></p>
                      <div class="space-y-3">
                        <div v-for="item in analytics.questionnaire.style" :key="item.label" class="space-y-1">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                            <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                          </div>
                          <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                            <div class="h-full bg-amber-400 rounded-full transition-all" :style="{ width: pct(item.count, analytics.questionnaire.styleTotal) + '%' }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="analytics.questionnaire.food.length" class="bg-stone-50 rounded-xl p-4">
                      <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.foodPrefs }} <span class="text-stone-300 font-normal normal-case">{{ L.top5 }}</span></p>
                      <div class="space-y-3">
                        <div v-for="item in analytics.questionnaire.food" :key="item.label" class="space-y-1">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                            <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                          </div>
                          <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                            <div class="h-full bg-stone-500 rounded-full transition-all" :style="{ width: pct(item.count, analytics.questionnaire.foodTotal) + '%' }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="analytics.questionnaire.transport.length" class="bg-stone-50 rounded-xl p-4">
                      <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">{{ L.transport }}</p>
                      <div class="space-y-3">
                        <div v-for="item in analytics.questionnaire.transport" :key="item.label" class="space-y-1">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-[15px] text-stone-700 leading-snug">{{ translateLabel(item.label) }}</span>
                            <span class="text-sm text-stone-400 shrink-0 font-semibold">{{ item.count }}</span>
                          </div>
                          <div class="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                            <div class="h-full bg-stone-500 rounded-full transition-all" :style="{ width: pct(item.count, analytics.questionnaire.transportTotal) + '%' }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Hotel Link & QR Code ─────────────────────────────────── -->
          <div v-if="isEditing && activeFormTab === 'link'" class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div class="px-5 py-3.5 border-b border-stone-100 bg-stone-50/80">
              <h3 class="text-xs font-bold uppercase tracking-widest text-stone-500">{{ L.guestLinkQr }}</h3>
            </div>
            <div class="p-5 flex flex-col sm:flex-row items-start gap-6">
              <div v-if="qrDataUrl" class="flex-shrink-0 text-center">
                <img :src="qrDataUrl" alt="QR Code" class="w-36 h-36 rounded-xl border border-stone-200" />
                <p class="text-[10px] text-stone-400 mt-1.5">{{ L.scanToTest }}</p>
              </div>
              <div class="flex-1 space-y-3 min-w-0">
                <p class="text-xs text-stone-500 font-medium">{{ L.shareLinkWith }}</p>
                <div class="flex gap-2">
                  <input
                    :value="hotelLink"
                    readonly
                    class="flex-1 min-w-0 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 focus:outline-none cursor-text select-all"
                  />
                  <button
                    @click="copyLink"
                    class="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200 transition-all active:scale-95 whitespace-nowrap"
                  >
                    {{ L.copy }}
                  </button>
                </div>
                <p class="text-[11px] text-stone-400">
                  {{ L.hotelId }}: <code class="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-mono">{{ selectedId }}</code>
                </p>
                <div v-if="form.logo_url" class="pt-1">
                  <p class="text-xs text-stone-400 mb-2">{{ L.logoPreview }}</p>
                  <img :src="form.logo_url" :alt="form.name" class="h-10 object-contain" />
                </div>
              </div>
            </div>
          </div>

          <!-- ── Deployment Kit ──────────────────────────────────────── -->
          <div v-if="isEditing && activeFormTab === 'link'" class="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div class="px-5 py-3.5 border-b border-stone-100 bg-stone-50/80">
              <h3 class="text-xs font-bold uppercase tracking-widest text-stone-500">{{ L.deploymentKit }}</h3>
              <p class="text-[11px] text-stone-400 mt-0.5">{{ L.deploymentDesc }}</p>
            </div>
            <div class="p-5 space-y-5">

              <!-- Email template -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {{ L.bookingEmail }}
                  </label>
                  <button
                    @click="copyKit(emailTemplate)"
                    class="px-3 py-1 bg-stone-100 text-stone-700 rounded-lg text-[10px] font-bold hover:bg-stone-200 transition-all active:scale-95"
                  >{{ L.copy }}</button>
                </div>
                <textarea
                  :value="emailTemplate"
                  readonly
                  rows="7"
                  class="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl text-[11px] text-stone-500 leading-relaxed resize-none font-mono focus:outline-none cursor-text select-all"
                ></textarea>
              </div>

              <!-- Front desk / room card -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {{ L.frontDeskCard }}
                  </label>
                  <button
                    @click="copyKit(frontDeskTemplate)"
                    class="px-3 py-1 bg-stone-100 text-stone-700 rounded-lg text-[10px] font-bold hover:bg-stone-200 transition-all active:scale-95"
                  >{{ L.copy }}</button>
                </div>
                <textarea
                  :value="frontDeskTemplate"
                  readonly
                  rows="5"
                  class="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl text-[11px] text-stone-500 leading-relaxed resize-none font-mono focus:outline-none cursor-text select-all"
                ></textarea>
              </div>

              <!-- WhatsApp / SMS -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {{ L.whatsappSms }}
                  </label>
                  <button
                    @click="copyKit(whatsappTemplate)"
                    class="px-3 py-1 bg-stone-100 text-stone-700 rounded-lg text-[10px] font-bold hover:bg-stone-200 transition-all active:scale-95"
                  >{{ L.copy }}</button>
                </div>
                <textarea
                  :value="whatsappTemplate"
                  readonly
                  rows="5"
                  class="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl text-[11px] text-stone-500 leading-relaxed resize-none font-mono focus:outline-none cursor-text select-all"
                ></textarea>
                <p class="text-[10px] text-stone-400 mt-1.5">{{ L.whatsappHint }}</p>
              </div>

            </div>
          </div>

          <!-- Bottom save bar (hidden on read-only tabs) -->
          <div v-if="activeFormTab !== 'link' && activeFormTab !== 'insights'" class="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-stone-50/90 backdrop-blur border-t border-stone-200 flex items-center justify-between">
            <p v-if="saveSuccess" class="text-sm text-emerald-600 font-semibold flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              {{ L.changesSaved }}
            </p>
            <p v-else class="text-xs text-stone-400">{{ L.rememberSave }}</p>
            <button
              @click="save"
              :disabled="saving || !form.name"
              class="px-8 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-700 transition-all disabled:opacity-40 active:scale-95 flex items-center gap-2"
            >
              <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ saving ? L.saving : L.saveHotel }}
            </button>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>
