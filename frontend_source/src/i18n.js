import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import heSettings from './locales/he/settings.json';
import enSettings from './locales/en/settings.json';

const resources = {
  he: {
    settings: heSettings,
  },
  en: {
    settings: enSettings,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'he', // default language
    fallbackLng: 'he',
    ns: ['settings'],
    defaultNS: 'settings',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;