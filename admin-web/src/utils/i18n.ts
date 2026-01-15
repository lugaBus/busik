export type Language = 'en' | 'ua' | 'ru';

export interface I18nText {
  en: string;
  ua: string;
  ru: string;
}

export function getI18nText(text: I18nText | string | undefined, lang: Language = 'ua'): string {
  if (!text) return '';
  if (typeof text === 'string') return text; // Fallback for old data
  return text[lang] || text.ua || text.en || text.ru || '';
}

export function createI18nText(en: string = '', ua: string = '', ru: string = ''): I18nText {
  return { en, ua, ru };
}
