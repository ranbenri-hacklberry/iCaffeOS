import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "./locales/en.json";
import translationHE from "./locales/he.json";

const getTranslation = (imported) => {
  if (imported && typeof imported === 'object' && 'default' in imported) {
    return imported.default;
  }
  return imported;
};

const resources = {
  en: {
    translation: getTranslation(translationEN),
  },
  he: {
    translation: getTranslation(translationHE),
  },
};

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
const deviceLanguage = typeof navigator !== 'undefined' 
  ? (navigator.language || navigator.userLanguage || 'he').split('-')[0]
  : 'he';

let defaultLanguage = 'he';
if (savedLanguage) {
  const code = savedLanguage.split('-')[0].toLowerCase();
  if (['he', 'en'].includes(code)) {
    defaultLanguage = code;
  }
} else {
  const code = deviceLanguage.split('-')[0].toLowerCase();
  if (['he', 'en'].includes(code)) {
    defaultLanguage = code;
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage, 
    fallbackLng: "he",
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;