/**
 * i18n Configuration — AutoLogic Multilingual Support
 *
 * Supports: Français (fr), English (en), Español (es), Deutsch (de)
 * Language detection: localStorage > browser language > fallback to 'fr'
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';

const resources = {
    fr: { translation: fr },
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
} as const;

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'fr',
        supportedLngs: ['fr', 'en', 'es', 'de'],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'autologic-language',
            caches: ['localStorage'],
        },
    });

export default i18n;

/** Supported language metadata with flags */
export const SUPPORTED_LANGUAGES = [
    { code: 'fr', flag: '🇫🇷', label: 'Français' },
    { code: 'en', flag: '🇬🇧', label: 'English' },
    { code: 'es', flag: '🇪🇸', label: 'Español' },
    { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];
