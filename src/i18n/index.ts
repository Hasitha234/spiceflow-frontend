import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import si from './si';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    si: { translation: si },
  },
  lng: localStorage.getItem('sf_lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
