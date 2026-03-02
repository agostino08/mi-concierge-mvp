import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUIStore } from '../stores/useUIStore';

/**
 * Single source of truth for language changes.
 * Syncs vue-i18n locale, uiStore.lang, and localStorage atomically.
 */
export function useLang() {
  const { locale } = useI18n();
  const uiStore = useUIStore();

  function setLang(code) {
    locale.value = code;
    uiStore.setLang(code); // also persists to localStorage
  }

  // Keep vue-i18n locale in sync when uiStore.lang is changed externally
  // (e.g. from loadSharedItinerary in the itinerary store)
  watch(
    () => uiStore.lang,
    (newLang) => {
      if (locale.value !== newLang) locale.value = newLang;
    },
    { immediate: true }
  );

  return { setLang };
}
