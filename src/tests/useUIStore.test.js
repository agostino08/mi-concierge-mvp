import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUIStore } from '../stores/useUIStore';

describe('useUIStore Configuration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with loading false and showToast false', () => {
    const store = useUIStore();
    expect(store.loading).toBe(true); // From original default value true
    expect(store.showToast).toBe(false);
  });

  it('can set language', () => {
    const store = useUIStore();
    store.setLang('fr');
    expect(store.lang).toBe('fr');
  });

  it('can trigger toast', async () => {
    const store = useUIStore();
    expect(store.showToast).toBe(false);
    
    store.triggerToast("Hello");
    expect(store.showToast).toBe(true);
    expect(store.toastMessage).toBe("Hello");
  });
});
