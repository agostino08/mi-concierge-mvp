<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUIStore } from '../stores/useUIStore';

const { locale } = useI18n();
const uiStore = useUIStore();

const languages = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'ca', label: '🟡 Català' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'ja', label: '🇯🇵 日本語' }
];

const isOpen = ref(false);

const currentLang = computed(() => {
  return languages.find(l => l.code === locale.value) || languages[0];
});

function selectLanguage(langCode) {
  locale.value = langCode;
  uiStore.setLang(langCode);
  isOpen.value = false;
}
</script>

<template>
  <div class="relative no-print z-50">
    <button 
      @click="isOpen = !isOpen" 
      class="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-xs font-medium text-stone-700 hover:bg-white transition-all border border-stone-200"
    >
      <span>{{ currentLang.label.split(' ')[0] }}</span> 
      <svg class="w-3 h-3 text-stone-400" :class="{'rotate-180': isOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
    </button>
    
    <div v-if="isOpen" class="absolute top-full right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
      <button 
        v-for="lang in languages" 
        :key="lang.code"
        @click="selectLanguage(lang.code)"
        class="w-full text-left px-4 py-2 hover:bg-stone-50 text-xs text-stone-700 transition-colors"
        :class="{ 'font-bold bg-stone-50 text-stone-900': lang.code === locale }"
      >
        {{ lang.label }}
      </button>
    </div>
  </div>
</template>
