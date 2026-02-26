import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bg from '@/locales/bg.json';
import en from '@/locales/en.json';

const STORAGE_KEY = 'gracia_lang';

function getStoredLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'bg' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  return 'bg';
}

i18n.use(initReactI18next).init({
  resources: {
    bg: { translation: bg },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function setStoredLanguage(lng: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
}

export default i18n;
