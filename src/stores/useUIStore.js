import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const loading = ref(true);
  const showToast = ref(false);
  const toastMessage = ref('');
  const lang = ref(localStorage.getItem('user_lang') || navigator.language.split('-')[0] || 'en');
  const error = ref(null);
  
  // Note: We don't store 'step' here anymore since it is managed by Vue Router

  function triggerToast(msg) {
    toastMessage.value = msg;
    showToast.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
  }

  function setLoading(val) {
    loading.value = val;
  }

  function setError(val) {
    error.value = val;
  }

  function setLang(val) {
    lang.value = val;
  }

  return {
    loading,
    showToast,
    toastMessage,
    lang,
    error,
    triggerToast,
    setLoading,
    setError,
    setLang
  };
});
