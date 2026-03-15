import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const FORM_DEFAULTS = {
  group: '',
  days: 3,
  style: [],
  food: [],
  budget: 'Balanced',
  transport: [],
};

export const useFormStore = defineStore('form', () => {
  const formData = ref({ ...FORM_DEFAULTS, style: [], food: [], transport: [] });

  // Persist form choices so the user can return to their questionnaire step
  watch(formData, (val) => {
    localStorage.setItem('mc_form', JSON.stringify(val));
  }, { deep: true });

  function resetForm() {
    formData.value = { ...FORM_DEFAULTS, style: [], food: [], transport: [] };
  }

  function setFormData(data) {
    formData.value = data;
  }

  return { formData, resetForm, setFormData };
});
