import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const loading = ref(true);
  const showToast = ref(false);
  const toastMessage = ref('');
  const error = ref(null);
  const lang = ref(localStorage.getItem('user_lang') || 'en'); // New users get English; returning users keep their choice

  function triggerToast(msg) {
    toastMessage.value = msg;
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 3000);
  }

  function setLoading(val) { loading.value = val; }

  function setError(val) { error.value = val; }

  function setLang(val) {
    lang.value = val;
    localStorage.setItem('user_lang', val); // persist so next visit restores preference
  }

  return { loading, showToast, toastMessage, lang, error, triggerToast, setLoading, setError, setLang };
});
