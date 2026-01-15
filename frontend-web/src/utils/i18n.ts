export type Language = 'en' | 'ua' | 'ru';

export interface I18nText {
  en?: string;
  ua?: string;
  ru?: string;
}

export function getI18nText(text: I18nText | string | undefined | null, language: Language): string {
  if (!text) {
    return '';
  }
  if (typeof text === 'string') {
    return text; // Fallback for old string fields
  }
  return text[language] || text.en || text.ua || text.ru || '';
}

export function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'ua';
  const lang = navigator.language || (navigator as any).userLanguage;
  if (lang.startsWith('uk')) return 'ua';
  if (lang.startsWith('ru')) return 'ru';
  return 'en';
}

export function createI18nText(): I18nText {
  return {
    en: '',
    ua: '',
    ru: '',
  };
}
