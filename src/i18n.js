import { createI18n } from 'vue-i18n';

import en from './locales/en.json';
import es from './locales/es.json';
import it from './locales/it.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import ca from './locales/ca.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

const savedLang = localStorage.getItem('user_lang');
const defaultLang = savedLang || 'en'; // New users always get English; returning users keep their choice

const i18n = createI18n({
  legacy: false, 
  locale: defaultLang,
  fallbackLocale: 'en',
  messages: {
    en, es, it, de, pt, fr, ca, ru, zh, ja
  }
});

export default i18n;
