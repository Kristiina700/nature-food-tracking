import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation files
import en from './locales/en.json';
import fi from './locales/fi.json';

const resources = {
  en: {
    translation: en
  },
  fi: {
    translation: fi
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fi', // Default language
    fallbackLng: 'fi',
    
    interpolation: {
      escapeValue: false // React already does escaping
    },

    // Optional: Save language preference to localStorage
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
