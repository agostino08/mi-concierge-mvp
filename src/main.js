import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import i18n from './i18n';
import * as Sentry from '@sentry/vue';
import './index.css';
import App from './App.vue';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  // Update this to match your production API domain
  tracePropagationTargets: ['localhost', /^https:\/\/mi-concierge-mvp\.vercel\.app\/api/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

app.mount('#app');
