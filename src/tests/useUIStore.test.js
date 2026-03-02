import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUIStore } from '../stores/useUIStore';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('useUIStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setActivePinia(createPinia());
  });

  it('initializes with loading=true and showToast=false', () => {
    const store = useUIStore();
    expect(store.loading).toBe(true);
    expect(store.showToast).toBe(false);
  });

  it('setLang updates lang and persists to localStorage', () => {
    const store = useUIStore();
    store.setLang('fr');
    expect(store.lang).toBe('fr');
    expect(localStorage.getItem('user_lang')).toBe('fr');
  });

  it('triggerToast sets toastMessage and showToast', () => {
    const store = useUIStore();
    store.triggerToast('Hello!');
    expect(store.showToast).toBe(true);
    expect(store.toastMessage).toBe('Hello!');
  });

  it('setError stores error message', () => {
    const store = useUIStore();
    store.setError('Something went wrong');
    expect(store.error).toBe('Something went wrong');
  });

  it('setError with null clears error', () => {
    const store = useUIStore();
    store.setError('err');
    store.setError(null);
    expect(store.error).toBeNull();
  });

  it('setLoading toggles loading state', () => {
    const store = useUIStore();
    store.setLoading(false);
    expect(store.loading).toBe(false);
    store.setLoading(true);
    expect(store.loading).toBe(true);
  });
});
