content = r"""<script setup>
import { ref, computed } from 'vue';
import { useHotelStore } from '../stores/useHotelStore';
import { useRouter } from 'vue-router';
import { useLang } from '../composables/useLang';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const hotelStore = useHotelStore();
const router = useRouter();
const { setLang } = useLang();

const isOpen = ref(false);
const current = ref({ code: 'en', label: 'English' });

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ca', label: 'Català' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
];

function selectLang(lang) {
  current.value = lang;
  setLang(lang.code);   // Updates i18n reactive → $t('welcome.continue') auto-switches
  isOpen.value = false;
}

function begin() {
  router.push('/questionnaire/1');
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (!event.target.closest('.lang-selector')) {
    isOpen.value = false;
  }
}
</script>

<template>
  <section
    class="h-dvh flex flex-col items-center justify-center text-center px-6"
    @click="handleClickOutside"
  >
    <!-- Hotel identity -->
    <div class="mb-8 space-y-3">
      <div v-if="hotelStore.hotelData?.logo_url" class="flex justify-center mb-4">
        <img
          :src="hotelStore.hotelData.logo_url"
          :alt="hotelStore.hotelData.name"
          class="h-14 object-contain drop-shadow-sm"
        />
      </div>
      <p class="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">
        {{ $t('welcome.title') }}
      </p>
      <h1 class="text-3xl font-serif text-stone-800 tracking-tight leading-snug italic">
        {{ hotelStore.hotelData?.name }}
      </h1>
      <p class="text-stone-400 text-sm">{{ $t('welcome.subtitle') }}</p>
    </div>

    <!-- Language selector + Continue -->
    <div class="w-full max-w-[280px] space-y-3 lang-selector">

      <!-- Trigger button -->
      <div class="relative">
        <button
          @click.stop="isOpen = !isOpen"
          class="w-full flex items-center justify-between px-5 py-3.5 bg-white/70 backdrop-blur-md border border-stone-200 rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-[0.98]"
        >
          <span class="text-base font-semibold text-stone-800">{{ current.label }}</span>
          <svg
            class="w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0"
            :class="{ 'rotate-180': isOpen }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown — fixed-height window, 3 items visible, then scroll -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0 scale-[0.98]"
        >
          <div
            v-if="isOpen"
            class="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50"
            @click.stop
          >
            <!-- Fixed height: exactly 3 items (~52px each = 156px), then scrollable -->
            <div class="overflow-y-auto" style="max-height: 156px">
              <button
                v-for="lang in languages"
                :key="lang.code"
                @click="selectLang(lang)"
                class="w-full px-5 py-3.5 text-left text-base font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors flex items-center justify-between"
                :class="{ 'bg-stone-50 font-semibold text-stone-900': current.code === lang.code }"
              >
                {{ lang.label }}
                <svg
                  v-if="current.code === lang.code"
                  class="w-4 h-4 text-stone-700 flex-shrink-0"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Continue button — text reacts to selected language immediately -->
      <button
        @click="begin"
        class="w-full py-4 bg-stone-800 text-white rounded-2xl text-base font-semibold tracking-wide shadow-xl hover:bg-stone-700 active:scale-95 transition-all"
      >
        {{ $t('welcome.continue') }}
      </button>

    </div>
  </section>
</template>
"""

with open('src/views/WelcomeView.vue', 'w', encoding='utf-8') as f:
    f.write(content.lstrip('\n'))
print('WelcomeView.vue written')
