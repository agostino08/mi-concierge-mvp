import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFormStore } from '../stores/useFormStore';

describe('useFormStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with correct defaults', () => {
    const store = useFormStore();
    expect(store.formData.group).toBe('');
    expect(store.formData.days).toBe(3);
    expect(store.formData.budget).toBe('Balanced');
    expect(store.formData.style).toEqual([]);
    expect(store.formData.food).toEqual([]);
    expect(store.formData.transport).toEqual([]);
  });

  it('setFormData replaces formData', () => {
    const store = useFormStore();
    const newData = { group: 'Solo', days: 5, style: ['Beach'], food: [], budget: 'Luxury', transport: ['Walking'] };
    store.setFormData(newData);
    expect(store.formData.group).toBe('Solo');
    expect(store.formData.days).toBe(5);
    expect(store.formData.budget).toBe('Luxury');
  });

  it('resetForm restores defaults', () => {
    const store = useFormStore();
    store.setFormData({ group: 'Family', days: 7, style: ['Nature'], food: ['Asian'], budget: 'Budget', transport: ['Train'] });
    store.resetForm();
    expect(store.formData.group).toBe('');
    expect(store.formData.days).toBe(3);
    expect(store.formData.budget).toBe('Balanced');
    expect(store.formData.style).toEqual([]);
  });
});
