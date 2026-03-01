<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const isOpen = ref(false);
const userMessage = ref('');
const messages = ref([]);
const hotelInfo = ref({});
const messagesContainer = ref(null);

onMounted(async () => {
  try {
    const res = await fetch('/hotel-info.json');
    hotelInfo.value = await res.json();
    messages.value.push({ role: 'bot', text: t('chatbot.welcome') });
  } catch (e) {
    console.error("No se pudo cargar hotel-info.json", e);
  }
});

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const sendMessage = () => {
  const msg = userMessage.value.trim().toLowerCase();
  if (!msg) return;

  messages.value.push({ role: 'user', text: userMessage.value });
  userMessage.value = '';
  scrollToBottom();

  setTimeout(() => {
    let reply = t('chatbot.fallback');
    
    if (msg.includes('checkout') || msg.includes('late')) {
      reply = `${t('chatbot.checkout')} ${hotelInfo.value.checkout}`;
    } else if (msg.includes('breakfast') || msg.includes('desayuno')) {
      reply = `${t('chatbot.breakfast')} ${hotelInfo.value.breakfast}`;
    } else if (msg.includes('wifi') || msg.includes('internet')) {
      reply = `${t('chatbot.wifi')} ${hotelInfo.value.wifi_pass}`;
    } else if (msg.includes('reception') || msg.includes('recepción') || msg.includes('phone')) {
      reply = `${t('chatbot.reception')} ${hotelInfo.value.reception}`;
    } else if (msg.includes('gym') || msg.includes('pool') || msg.includes('gimnasio')) {
      reply = `${t('chatbot.gym')} ${hotelInfo.value.gym}`;
    }

    messages.value.push({ role: 'bot', text: reply });
    scrollToBottom();
  }, 500);
};

</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 no-print flex flex-col items-end">
    
    <!-- Ventana de Chat -->
    <div v-if="isOpen" class="w-80 h-96 bg-white rounded-3xl shadow-2xl mb-4 border border-stone-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
      <div class="bg-stone-900 text-white p-4 flex justify-between items-center">
        <h4 class="font-serif font-bold tracking-wide">{{ $t('chatbot.title') }}</h4>
        <button @click="isOpen = false" class="text-stone-300 hover:text-white transition">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50 text-sm">
         <div v-for="(m, i) in messages" :key="i" class="flex" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
            <div :class="m.role === 'user' ? 'bg-stone-200 text-stone-800' : 'bg-white border border-stone-200 text-stone-600'" class="px-3 py-2 rounded-2xl max-w-[85%] leading-relaxed shadow-sm">
               {{ m.text }}
            </div>
         </div>
      </div>
      
      <div class="p-3 bg-white border-t border-stone-100 flex gap-2">
         <input v-model="userMessage" @keyup.enter="sendMessage" type="text" :placeholder="$t('chatbot.placeholder')" class="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
         <button @click="sendMessage" class="bg-stone-900 text-white p-2 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-md">
            <svg class="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
         </button>
      </div>
    </div>
    
    <!-- Botón Flotante -->
    <button v-if="!isOpen" @click="isOpen = true" class="w-14 h-14 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none animate-in fade-in duration-300 group ring-4 ring-white">
      <svg class="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
    </button>
  </div>
</template>
