import { defineStore } from 'pinia';
import { ref } from 'vue';

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

  function resetForm() {
    formData.value = { ...FORM_DEFAULTS, style: [], food: [], transport: [] };
  }

  function setFormData(data) {
    formData.value = data;
  }

  return { formData, resetForm, setFormData };
});
