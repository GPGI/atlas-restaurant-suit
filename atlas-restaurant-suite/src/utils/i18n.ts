export type Language = 'en' | 'bg';

export interface Translations {
  scanQRCode: string;
  viewMenu: string;
  table: string;
  available: string;
  occupied: string;
  instructions: string;
  scanWithPhone: string;
  copyUrl: string;
  urlCopied: string;
  share: string;
  download: string;
}

const translations: Record<Language, Translations> = {
  en: {
    scanQRCode: 'Scan QR code to view menu',
    viewMenu: 'View Menu',
    table: 'Table',
    available: 'Available',
    occupied: 'Occupied',
    instructions: 'Point your phone camera at the QR code',
    scanWithPhone: 'Scan with your phone camera',
    copyUrl: 'Copy URL',
    urlCopied: 'URL copied to clipboard',
    share: 'Share',
    download: 'Download QR Code',
  },
  bg: {
    scanQRCode: 'Сканирайте QR код за меню',
    viewMenu: 'Виж меню',
    table: 'Маса',
    available: 'Свободна',
    occupied: 'Заета',
    instructions: 'Насочете камерата на телефона към QR кода',
    scanWithPhone: 'Сканирайте с камерата на телефона',
    copyUrl: 'Копирай URL',
    urlCopied: 'URL копиран в клипборда',
    share: 'Сподели',
    download: 'Изтегли QR код',
  },
};

export const getLanguage = (): Language => {
  // Try to detect from browser
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'bg') return 'bg';
  return 'en';
};

export const getTranslations = (lang?: Language): Translations => {
  const language = lang || getLanguage();
  return translations[language] || translations.en;
};

export const setLanguage = (lang: Language) => {
  localStorage.setItem('preferred_language', lang);
};

export const getStoredLanguage = (): Language => {
  const stored = localStorage.getItem('preferred_language');
  if (stored === 'bg' || stored === 'en') {
    return stored;
  }
  return getLanguage();
};
