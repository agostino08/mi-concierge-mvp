import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRecommendationsStore } from '../stores/useRecommendationsStore';
import { useUIStore } from '../stores/useUIStore';

vi.mock('../services/api', () => ({ generateItinerary: vi.fn() }));

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

describe('useRecommendationsStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with empty recommendations, generating=false, agentStep=null', () => {
    const store = useRecommendationsStore();
    expect(store.generating).toBe(false);
    expect(store.agentStep).toBeNull();
    expect(store.recommendations.activities).toEqual([]);
    expect(store.recommendations.food).toEqual([]);
    expect(store.recommendations.transport).toEqual([]);
  });

  it('resetRecommendations clears all arrays', () => {
    const store = useRecommendationsStore();
    store.recommendations.activities = [{ title: 'Test' }];
    store.resetRecommendations();
    expect(store.recommendations.activities).toEqual([]);
  });

  it('setRecommendations sets the data', () => {
    const store = useRecommendationsStore();
    store.setRecommendations({ activities: [{ title: 'Park Güell' }], food: [], transport: [] });
    expect(store.recommendations.activities[0].title).toBe('Park Güell');
  });

  it('setRecommendations with null falls back to empty', () => {
    const store = useRecommendationsStore();
    store.setRecommendations(null);
    expect(store.recommendations.activities).toEqual([]);
  });

  it('generateRecommendations sets error on API failure', async () => {
    const { generateItinerary } = await import('../services/api');
    generateItinerary.mockRejectedValueOnce(new Error('Network error'));

    const store = useRecommendationsStore();
    const uiStore = useUIStore();
    await store.generateRecommendations({}, {}, 'en');

    expect(store.generating).toBe(false);
    expect(uiStore.error).toBe('Network error');
  });

  it('generateRecommendations sets recommendations from onContent callback', async () => {
    const { generateItinerary } = await import('../services/api');
    const mockData = {
      activities: [{ title: 'Museum', description: 'Great art', is_partner: false }],
      food: [{ title: 'Tapas Bar', description: 'Local food', is_partner: true }],
      transport: [{ title: 'Metro', description: 'Fast & cheap' }],
    };

    generateItinerary.mockImplementationOnce(async (_hotel, _form, _lang, callbacks) => {
      callbacks.onContent(mockData);
    });

    const store = useRecommendationsStore();
    await store.generateRecommendations({}, {}, 'en');

    expect(store.recommendations.activities[0].title).toBe('Museum');
    expect(store.recommendations.food[0].title).toBe('Tapas Bar');
    expect(store.generating).toBe(false);
  });

  it('agentStep is null after generation completes', async () => {
    const { generateItinerary } = await import('../services/api');
    generateItinerary.mockImplementationOnce(async (_hotel, _form, _lang, callbacks) => {
      callbacks.onToolCall('get_weather', { city: 'Barcelona' });
      callbacks.onContent({ activities: [], food: [], transport: [] });
    });
    const store = useRecommendationsStore();
    await store.generateRecommendations({ city: 'Barcelona' }, {}, 'en');
    expect(store.agentStep).toBeNull();
  });

  it('generateRecommendations sets error from onError callback', async () => {
    const { generateItinerary } = await import('../services/api');
    generateItinerary.mockImplementationOnce(async (_hotel, _form, _lang, callbacks) => {
      callbacks.onError('Agent reached maximum steps');
    });
    const store = useRecommendationsStore();
    const uiStore = useUIStore();
    await store.generateRecommendations({}, {}, 'en');
    expect(uiStore.error).toBe('Agent reached maximum steps');
  });
});
