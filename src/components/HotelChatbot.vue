<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { logEvent } from '../services/analytics';
import { useI18n } from 'vue-i18n';
import { useHotelStore } from '../stores/useHotelStore';
import { useUIStore } from '../stores/useUIStore';

const { t, locale } = useI18n();
const hotelStore = useHotelStore();
const uiStore = useUIStore();

const hotelInfo = computed(() => hotelStore.hotelData || {});

const isOpen = ref(false);
const userMessage = ref('');
const messages = ref([]);
const isTyping = ref(false);
const messagesContainer = ref(null);

// ─── FAQ pill translation ──────────────────────────────────────────────────────
// Maps faq.id → translated pill_text for the current language
const translatedPills = ref({});

async function translateFaqPills(lang) {
  const faqs = hotelInfo.value.faqs;
  if (!faqs?.length) return;
  if (!lang || lang === 'en') { translatedPills.value = {}; return; }

  const pillTexts = faqs.map(f => f.pill_text || f.question).filter(Boolean);
  if (!pillTexts.length) return;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: pillTexts, targetLang: lang }),
    });
    const data = await res.json();
    if (data.translations?.length) {
      const map = {};
      faqs.forEach((faq, i) => { if (data.translations[i]) map[faq.id] = data.translations[i]; });
      translatedPills.value = map;
    }
  } catch { /* keep original text on error */ }
}

watch(locale, (newLang) => translateFaqPills(newLang));
watch(() => hotelInfo.value.faqs, () => translateFaqPills(locale.value));

onMounted(() => {
  messages.value = [{ role: 'bot', text: t('chatbot.welcome') }];
});

watch(isOpen, (val) => {
  if (val) logEvent(hotelInfo.value.id, 'chat_opened');
});

watch(locale, () => {
  if (messages.value.length <= 1) {
    messages.value = [{ role: 'bot', text: t('chatbot.welcome') }];
  }
});

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// ─── Dynamic quick actions ────────────────────────────────────────────────────
const TOPIC_FIELDS = {
  checkout:     'checkout',
  breakfast:    'breakfast',
  wifi:         'wifi_pass',
  reception:    'reception',
  gym:          'gym',
  pool:         'pool',
  spa:          'spa',
  parking:      'parking',
  restaurant:   'restaurant',
  room_service: 'room_service',
  facilities:   'facilities',
};

const standardActions = computed(() =>
  Object.entries(TOPIC_FIELDS)
    .filter(([, field]) => !!hotelInfo.value[field])
    .map(([key]) => key)
);

const faqActions = computed(() => hotelInfo.value.faqs || []);
const hasAnyAction = computed(() => standardActions.value.length > 0 || faqActions.value.length > 0);

// ─── AI call ──────────────────────────────────────────────────────────────────
async function callChatAI(text) {
  const historyForApi = [...messages.value, { role: 'user', text }];
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hotel: hotelInfo.value,
      messages: historyForApi,
      lang: uiStore.lang || locale.value || 'en',
    }),
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  const data = await response.json();
  return data.reply || t('chatbot.fallback');
}

// ─── Local fallback ────────────────────────────────────────────────────────────
const KEYWORDS = {
  checkout:     ['checkout', 'salida', 'uscita', 'depart', 'выезд', '退房', 'チェックアウト'],
  breakfast:    ['breakfast', 'desayuno', 'colazione', 'завтрак', '早餐', '朝食'],
  wifi:         ['wifi', 'wi-fi', 'password', 'пароль', '密码', 'パスワード'],
  reception:    ['reception', 'recepcion', 'rezeption', 'phone', 'telefono', 'ресепшен', '前台', 'フロント'],
  gym:          ['gym', 'fitness', 'gimnasio', 'palestra', '健身房', 'ジム'],
  pool:         ['pool', 'swim', 'piscina', 'бассейн', '游泳池', 'プール'],
  spa:          ['spa', 'wellness', 'massage', 'массаж', '按摩', 'マッサージ'],
  parking:      ['parking', 'aparcamiento', 'parkplatz', 'стоянка', '停车', '駐車'],
  restaurant:   ['restaurant', 'restaurante', 'dinner', 'ресторан', '餐厅', 'レストラン'],
  room_service: ['room service', 'zimmerservice', '客房服务', 'ルームサービス'],
  facilities:   ['facilities', 'amenities', 'instalaciones', 'удобства', '设施', '施設'],
};

function localFallback(text) {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const info = hotelInfo.value;
  const replies = {
    checkout:     info.checkout    ? `${t('chatbot.checkout')} ${info.checkout}`        : null,
    breakfast:    info.breakfast   ? `${t('chatbot.breakfast')} ${info.breakfast}`      : null,
    wifi:         info.wifi_pass   ? `${t('chatbot.wifi')} ${info.wifi_pass}`           : null,
    reception:    info.reception   ? `${t('chatbot.reception')} ${info.reception}`      : null,
    gym:          info.gym         ? `${t('chatbot.gym')} ${info.gym}`                  : null,
    pool:         info.pool        ? `${t('chatbot.pool')} ${info.pool}`                : null,
    spa:          info.spa         ? `${t('chatbot.spa')} ${info.spa}`                  : null,
    parking:      info.parking     ? `${t('chatbot.parking')} ${info.parking}`          : null,
    restaurant:   info.restaurant  ? `${t('chatbot.restaurant')} ${info.restaurant}`    : null,
    room_service: info.room_service? `${t('chatbot.room_service')} ${info.room_service}`: null,
    facilities:   info.facilities  ? `${t('chatbot.facilities')} ${info.facilities}`    : null,
  };
  for (const [topic, kws] of Object.entries(KEYWORDS)) {
    if (kws.some(kw => lower.includes(kw)) && replies[topic]) return replies[topic];
  }
  return t('chatbot.fallback');
}

// ─── Message flow ─────────────────────────────────────────────────────────────
async function sendWithAI(text) {
  isTyping.value = true;
  await scrollToBottom();
  try {
    const reply = await callChatAI(text);
    isTyping.value = false;
    messages.value.push({ role: 'bot', text: reply });
  } catch (e) {
    console.warn('AI chat failed, using local fallback:', e.message);
    isTyping.value = false;
    messages.value.push({ role: 'bot', text: localFallback(text) });
  }
  await scrollToBottom();
}

function quickAction(topic) {
  const label = t(`chatbot.quick_${topic}`);
  messages.value.push({ role: 'user', text: label });
  logEvent(hotelInfo.value.id, 'chat_pill', { topic });
  sendWithAI(label);
}

function faqAction(faq) {
  const display = faq.pill_text || faq.question;
  messages.value.push({ role: 'user', text: display });
  logEvent(hotelInfo.value.id, 'chat_faq', { question: faq.question });
  // Route through AI so the answer is automatically translated to the guest's language
  sendWithAI(faq.question);
}

function sendMessage() {
  const msg = userMessage.value.trim();
  if (!msg) return;
  messages.value.push({ role: 'user', text: msg });
  userMessage.value = '';
  scrollToBottom();
  logEvent(hotelInfo.value.id, 'chat_message');
  sendWithAI(msg);
}
</script>

<template>
  <!-- Desktop semi-transparent backdrop (prevents content bleeding through) -->
  <div
    v-if="isOpen"
    class="hidden sm:block fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
    @click="isOpen = false"
  />

  <!-- Main container: full-screen on mobile, corner popup on desktop -->
  <div
    class="fixed z-50 no-print flex flex-col"
    :class="isOpen
      ? 'top-2 left-2 right-2 bottom-2 sm:top-auto sm:left-auto sm:bottom-6 sm:right-6 sm:items-end'
      : 'bottom-6 right-6 items-end'"
  >
    <!-- Chat window -->
    <transition name="chat-slide">
      <div
        v-if="isOpen"
        class="chat-window sm:w-[32rem] bg-white rounded-2xl sm:rounded-3xl shadow-2xl sm:mb-4 border border-stone-200/80 overflow-hidden flex flex-col"
      >
        <!-- ── Header ── -->
        <div class="bg-stone-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-600/20 border border-amber-400/30 flex items-center justify-center">
                <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-stone-900"></span>
            </div>
            <div>
              <h4 class="font-semibold text-[15px] leading-tight">{{ $t('chatbot.title') }}</h4>
              <p class="text-[12px] text-stone-400 leading-none mt-0.5">{{ hotelInfo.name || '' }}</p>
            </div>
          </div>
          <button
            @click="isOpen = false"
            class="text-stone-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10 -mr-1"
            aria-label="Close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- ── Messages ── -->
        <div
          ref="messagesContainer"
          class="flex-1 px-4 py-5 overflow-y-auto space-y-3 bg-stone-50 min-h-0"
        >
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="flex"
            :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="px-4 py-3 max-w-[88%] text-[15px] leading-[1.65]"
              :class="m.role === 'user'
                ? 'bg-stone-800 text-white rounded-3xl rounded-br-md'
                : 'bg-white border border-stone-200 text-stone-700 rounded-3xl rounded-bl-md shadow-sm'"
              style="white-space: pre-line"
            >{{ m.text }}</div>
          </div>

          <!-- Typing indicator -->
          <div v-if="isTyping" class="flex justify-start">
            <div class="bg-white border border-stone-200 rounded-3xl rounded-bl-md px-4 py-4 shadow-sm">
              <div class="flex gap-1.5 items-center">
                <span class="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style="animation-delay:0ms"></span>
                <span class="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style="animation-delay:160ms"></span>
                <span class="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style="animation-delay:320ms"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Quick actions ── -->
        <div v-if="hasAnyAction" class="bg-white border-t border-stone-100 flex-shrink-0">
          <div class="px-4 pt-3 pb-1">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mb-2.5">
              {{ $t('chatbot.title') }}
            </p>
            <div v-if="standardActions.length" class="flex flex-wrap gap-2 mb-2">
              <button
                v-for="topic in standardActions"
                :key="topic"
                @click="quickAction(topic)"
                :disabled="isTyping"
                class="px-4 py-2 bg-stone-100 text-stone-600 rounded-full text-[13px] font-semibold hover:bg-stone-800 hover:text-white transition-all active:scale-95 disabled:opacity-40"
              >
                {{ $t(`chatbot.quick_${topic}`) }}
              </button>
            </div>
            <div v-if="faqActions.length" class="flex flex-wrap gap-2 mb-2">
              <button
                v-for="faq in faqActions"
                :key="faq.id"
                @click="faqAction(faq)"
                :disabled="isTyping"
                class="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-[13px] font-semibold hover:bg-amber-400 hover:text-white hover:border-amber-400 transition-all active:scale-95 disabled:opacity-40"
              >
                {{ translatedPills[faq.id] || faq.pill_text || faq.question }}
              </button>
            </div>
          </div>
        </div>

        <!-- ── Input ── -->
        <div class="px-4 py-4 bg-white flex gap-2.5 flex-shrink-0 border-t border-stone-100">
          <input
            v-model="userMessage"
            @keyup.enter="sendMessage"
            type="text"
            :placeholder="$t('chatbot.placeholder')"
            :disabled="isTyping"
            class="flex-1 bg-stone-100 rounded-full px-5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all placeholder:text-stone-400 disabled:opacity-60"
          />
          <button
            @click="sendMessage"
            :disabled="!userMessage.trim() || isTyping"
            class="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-stone-700 active:scale-90 transition-all shadow-md disabled:opacity-40 disabled:scale-100 flex-shrink-0"
            aria-label="Send"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- ── FAB: hidden on mobile when chat is open (header close button suffices) ── -->
    <button
      @click="isOpen = !isOpen"
      class="w-14 h-14 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all ring-4 ring-white flex-shrink-0 self-end mt-3 sm:mt-0"
      :class="{ 'hidden sm:flex': isOpen }"
      :aria-label="$t('chatbot.title')"
    >
      <transition name="icon-switch" mode="out-in">
        <svg v-if="!isOpen" key="chat" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <svg v-else key="close" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </transition>
    </button>
  </div>
</template>

<style scoped>
/* Mobile: chat fills the fixed container (top-2 left-2 right-2 bottom-2) */
.chat-window {
  flex: 1;
}

/* Desktop: constrained height, not flex-growing */
@media (min-width: 640px) {
  .chat-window {
    flex: none;
    max-height: min(720px, calc(100dvh - 100px));
  }
}

.chat-slide-enter-active, .chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.chat-slide-enter-from, .chat-slide-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}
.icon-switch-enter-active, .icon-switch-leave-active {
  transition: all 0.2s ease;
}
.icon-switch-enter-from, .icon-switch-leave-to {
  opacity: 0;
  transform: scale(0.6) rotate(30deg);
}
</style>
