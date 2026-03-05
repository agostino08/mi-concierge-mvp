<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHotelStore } from '../stores/useHotelStore';

const { t } = useI18n();
const hotelStore = useHotelStore();

const hotelInfo = computed(() => hotelStore.hotelData || {});

const isOpen = ref(false);
const userMessage = ref('');
const messages = ref([]);
const isTyping = ref(false);
const messagesContainer = ref(null);

onMounted(() => {
  messages.value.push({ role: 'bot', text: t('chatbot.welcome') });
});

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// Multi-language keyword detection
const KEYWORDS = {
  checkout: ['checkout', 'check-out', 'leave', 'late check', 'salida', 'uscita', 'abreise', 'saida', 'sortie', 'depart', 'wyezd', 'tuifang', 'chekku', 'выезд', '退房', 'チェックアウト', 'partir'],
  breakfast: ['breakfast', 'desayuno', 'colazione', 'fruhstuck', 'cafe', 'manha', 'dejeuner', 'esmorzar', 'zavtrak', 'zaofan', 'choshoku', 'завтрак', '早餐', '朝食', 'petit-dejeuner'],
  wifi: ['wifi', 'wi-fi', 'internet', 'password', 'contraseña', 'contrasenya', 'parola', 'passwort', 'senha', 'mot de passe', 'parol', 'mima', 'pasuwado', 'пароль', '密码', 'パスワード'],
  reception: ['reception', 'recepcion', 'recepció', 'rezeption', 'recepcao', 'accueil', 'phone', 'telefono', 'telephone', 'contact', 'stojka', 'qiantai', 'furonto', 'ресепшен', '前台', 'フロント'],
  gym: ['gym', 'fitness', 'gimnasio', 'palestra', 'fitnessstudio', 'academia', 'salle de sport', 'gimnas', 'sport', 'jianshenfang', 'jimu', '健身房', 'ジム'],
  pool: ['pool', 'swim', 'piscina', 'schwimmbad', 'piscine', 'kolam', 'бассейн', '游泳池', 'プール', 'natacion'],
  spa: ['spa', 'wellness', 'massage', 'masaje', 'massaggio', 'massagem', 'massagem', 'релакс', 'массаж', '按摩', 'マッサージ', 'beauty', 'sauna'],
  parking: ['parking', 'car park', 'aparcamiento', 'parcheggio', 'parkplatz', 'estacionamento', 'parkering', 'стоянка', 'parken', '停车', '駐車', 'garage', 'valet'],
  restaurant: ['restaurant', 'restaurante', 'ristorante', 'dine', 'dining', 'dinner', 'lunch', 'food', 'eat', 'ресторан', '餐厅', 'レストラン', 'tavern', 'bistro'],
  room_service: ['room service', 'room-service', 'roomservice', 'habitaciones', 'zimmerservice', 'servizio in camera', 'serviço de quarto', 'обслуживание номеров', '客房服务', 'ルームサービス'],
  facilities: ['facilities', 'amenities', 'instalaciones', 'einrichtungen', 'strutture', 'instalações', 'удобства', '设施', '施設', 'services', 'feature'],
};

// Topics that map to hotel data fields
const TOPIC_FIELDS = {
  checkout: 'checkout',
  breakfast: 'breakfast',
  wifi: 'wifi_pass',
  reception: 'reception',
  gym: 'gym',
  pool: 'pool',
  spa: 'spa',
  parking: 'parking',
  restaurant: 'restaurant',
  room_service: 'room_service',
  facilities: 'facilities',
};

// Dynamic quick actions: only show if the hotel has data for that field
const standardActions = computed(() =>
  Object.entries(TOPIC_FIELDS)
    .filter(([, field]) => !!hotelInfo.value[field])
    .map(([key]) => key)
);

// Custom FAQ pills from hotel data
const faqActions = computed(() => hotelInfo.value.faqs || []);

function detectTopic(msg) {
  const lower = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [topic, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return topic;
  }
  return null;
}

function getReply(topic) {
  const info = hotelInfo.value;
  const replies = {
    checkout:     info.checkout    ? `${t('chatbot.checkout')} ${info.checkout}`       : t('chatbot.fallback'),
    breakfast:    info.breakfast   ? `${t('chatbot.breakfast')} ${info.breakfast}`     : t('chatbot.fallback'),
    wifi:         info.wifi_pass   ? `${t('chatbot.wifi')} ${info.wifi_pass}`          : t('chatbot.fallback'),
    reception:    info.reception   ? `${t('chatbot.reception')} ${info.reception}`     : t('chatbot.fallback'),
    gym:          info.gym         ? `${t('chatbot.gym')} ${info.gym}`                 : t('chatbot.fallback'),
    pool:         info.pool        ? `${t('chatbot.pool')} ${info.pool}`               : t('chatbot.fallback'),
    spa:          info.spa         ? `${t('chatbot.spa')} ${info.spa}`                 : t('chatbot.fallback'),
    parking:      info.parking     ? `${t('chatbot.parking')} ${info.parking}`         : t('chatbot.fallback'),
    restaurant:   info.restaurant  ? `${t('chatbot.restaurant')} ${info.restaurant}`   : t('chatbot.fallback'),
    room_service: info.room_service? `${t('chatbot.room_service')} ${info.room_service}`: t('chatbot.fallback'),
    facilities:   info.facilities  ? `${t('chatbot.facilities')} ${info.facilities}`   : t('chatbot.fallback'),
  };
  return replies[topic] || t('chatbot.fallback');
}

function showBotReply(text) {
  isTyping.value = true;
  scrollToBottom();
  setTimeout(() => {
    isTyping.value = false;
    messages.value.push({ role: 'bot', text });
    scrollToBottom();
  }, 700);
}

function quickAction(topic) {
  const label = t(`chatbot.quick_${topic}`);
  messages.value.push({ role: 'user', text: label });
  showBotReply(getReply(topic));
}

function faqAction(faq) {
  messages.value.push({ role: 'user', text: faq.question });
  showBotReply(faq.answer);
}

function sendMessage() {
  const msg = userMessage.value.trim();
  if (!msg) return;
  messages.value.push({ role: 'user', text: msg });
  userMessage.value = '';
  scrollToBottom();
  const topic = detectTopic(msg);
  showBotReply(getReply(topic));
}

const hasAnyAction = computed(() => standardActions.value.length > 0 || faqActions.value.length > 0);
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 no-print flex flex-col items-end">

    <!-- Chat window -->
    <transition name="chat-slide">
      <div
        v-if="isOpen"
        class="w-80 bg-white rounded-3xl shadow-2xl mb-4 border border-stone-200 overflow-hidden flex flex-col"
        style="max-height: min(520px, calc(100vh - 120px))"
      >
        <!-- Header -->
        <div class="bg-stone-900 text-white px-5 py-4 flex justify-between items-center flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h4 class="font-serif font-bold text-sm leading-none">{{ $t('chatbot.title') }}</h4>
              <p class="text-[10px] text-stone-400 mt-0.5">{{ hotelInfo.name || '' }}</p>
            </div>
          </div>
          <button
            @click="isOpen = false"
            class="text-stone-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
            aria-label="Close chat"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50 text-sm min-h-0">
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="flex"
            :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              :class="m.role === 'user'
                ? 'bg-stone-800 text-white rounded-3xl rounded-br-lg'
                : 'bg-white border border-stone-200 text-stone-700 rounded-3xl rounded-bl-lg shadow-sm'"
              class="px-4 py-2.5 max-w-[85%] leading-relaxed text-[13px]"
            >
              {{ m.text }}
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="isTyping" class="flex justify-start">
            <div class="bg-white border border-stone-200 rounded-3xl rounded-bl-lg px-4 py-3 shadow-sm">
              <div class="flex gap-1 items-center">
                <span class="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
                <span class="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
                <span class="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick action chips -->
        <div v-if="hasAnyAction" class="px-3 pt-3 pb-1 bg-white border-t border-stone-100 flex-shrink-0">
          <!-- Standard hotel info pills -->
          <div v-if="standardActions.length" class="flex flex-wrap gap-1.5 mb-1.5">
            <button
              v-for="topic in standardActions"
              :key="topic"
              @click="quickAction(topic)"
              class="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-full text-[10px] font-bold uppercase tracking-wide hover:bg-stone-200 hover:text-stone-800 transition-all active:scale-95"
            >
              {{ $t(`chatbot.quick_${topic}`) }}
            </button>
          </div>
          <!-- Custom FAQ pills -->
          <div v-if="faqActions.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="faq in faqActions"
              :key="faq.id"
              @click="faqAction(faq)"
              class="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold tracking-wide hover:bg-amber-100 transition-all active:scale-95"
            >
              {{ faq.question }}
            </button>
          </div>
        </div>

        <!-- Input -->
        <div class="p-3 bg-white flex gap-2 flex-shrink-0">
          <input
            v-model="userMessage"
            @keyup.enter="sendMessage"
            type="text"
            :placeholder="$t('chatbot.placeholder')"
            class="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
          />
          <button
            @click="sendMessage"
            :disabled="!userMessage.trim()"
            class="bg-stone-900 text-white p-2.5 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-md disabled:opacity-40 disabled:scale-100"
            aria-label="Send"
          >
            <svg class="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <!-- FAB button -->
    <button
      @click="isOpen = !isOpen"
      class="w-14 h-14 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none ring-4 ring-white"
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
  transform: scale(0.7) rotate(45deg);
}
</style>
